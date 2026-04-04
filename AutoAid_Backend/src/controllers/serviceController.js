const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { spawn } = require('child_process');
const path = require('path');

exports.createServiceRequest = async (req, res) => {
    try {
        const { uid, serviceType, contactNumber, details, userLocation } = req.body;

        if (!uid || !serviceType || !contactNumber || !details) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify user exists (optional but recommended)
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newRequest = new ServiceRequest({
            userId: uid,
            serviceType,
            contactNumber,
            details,
            userLocation
        });

        await newRequest.save();

        res.status(201).json({ 
            message: 'Service request created successfully', 
            requestId: newRequest._id,
            request: newRequest 
        });

    } catch (error) {
        console.error('Error creating service request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.assignProvider = async (req, res) => {
    try {
        const { requestId, providerId, negotiation } = req.body;
        
        if (!requestId || !providerId) {
            return res.status(400).json({ error: 'Request ID and Provider ID are required' });
        }

        // Build update object
        const updateObj = { providerId };
        if (negotiation && negotiation.offeredRate) {
            updateObj.negotiation = {
                originalRate: negotiation.originalRate || null,
                offeredRate: Number(negotiation.offeredRate),
                counterSent: false
            };
        }

        const request = await ServiceRequest.findByIdAndUpdate(
            requestId,
            updateObj,
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ error: 'Service request not found' });
        }

        // Fetch user info to send to provider
        const user = await User.findOne({ uid: request.userId });

        // Emit socket event to the provider
        const io = req.app.get('io');
        const connectedProviders = req.app.get('connectedProviders');
        
        if (io && connectedProviders) {
            const provider = await User.findById(providerId);
            if (provider) {
                const socketId = connectedProviders.get(provider.uid);
                if (socketId) {
                    io.to(socketId).emit('new_service_request', {
                        request,
                        user: user ? { name: user.fullName, contact: user.contactNumber } : null,
                        negotiation: request.negotiation || null
                    });
                }
            }
        }

        res.status(200).json({ success: true, message: 'Provider assigned successfully', request });
    } catch (error) {
        console.error('Error assigning provider:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Provider sends a counter offer (Temporary Driver only, one-time)
// @route   POST /api/services/request/:id/counter
// @access  Provider
exports.sendCounterOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { counterRate } = req.body;
        const providerId = req.user._id;

        if (!counterRate || isNaN(counterRate) || counterRate <= 0) {
            return res.status(400).json({ error: 'A valid counterRate is required' });
        }

        const request = await ServiceRequest.findById(id);
        if (!request) return res.status(404).json({ error: 'Service request not found' });
        if (request.serviceType !== 'Temporary Driver') {
            return res.status(400).json({ error: 'Counter offer is only for Temporary Driver requests' });
        }
        if (request.providerId.toString() !== providerId.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        if (['Accepted', 'Rejected', 'Cancelled', 'Countered'].includes(request.status)) {
            return res.status(400).json({ error: 'Cannot counter at this stage' });
        }
        if (request.negotiation?.counterSent) {
            return res.status(400).json({ error: 'You have already sent one counter offer' });
        }

        // Update negotiation block
        request.negotiation = {
            ...request.negotiation,
            counterRate: Number(counterRate),
            counterSent: true
        };
        request.status = 'Countered';
        await request.save();

        // Notify user via socket
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        if (io && connectedUsers) {
            const userSocketId = connectedUsers.get(request.userId.toString());
            if (userSocketId) {
                const provider = await User.findById(providerId);
                io.to(userSocketId).emit('counter_offer', {
                    requestId: request._id,
                    counterRate: Number(counterRate),
                    providerName: provider?.fullName || 'Driver'
                });
            }
        }

        res.status(200).json({ success: true, message: 'Counter offer sent', request });
    } catch (error) {
        console.error('Error sending counter offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    User accepts or rejects a counter offer
// @route   POST /api/services/request/:id/counter/respond
// @access  User
exports.respondToCounter = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accept' | 'reject'

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'action must be "accept" or "reject"' });
        }

        const request = await ServiceRequest.findById(id);
        if (!request) return res.status(404).json({ error: 'Service request not found' });
        if (request.status !== 'Countered') {
            return res.status(400).json({ error: 'No pending counter offer to respond to' });
        }

        const io = req.app.get('io');
        const connectedProviders = req.app.get('connectedProviders');

        if (action === 'accept') {
            request.negotiation.finalRate = request.negotiation.counterRate;
            request.status = 'Accepted';
            await request.save();

            // Mark provider unavailable
            if (request.providerId) {
                await User.findByIdAndUpdate(request.providerId, { isAvailable: false });
            }

            // Notify provider
            if (io && connectedProviders) {
                const provider = await User.findById(request.providerId);
                if (provider) {
                    const providerSocketId = connectedProviders.get(provider.uid);
                    if (providerSocketId) {
                        io.to(providerSocketId).emit('counter_accepted', {
                            requestId: request._id,
                            finalRate: request.negotiation.finalRate
                        });
                    }
                }
            }
        } else {
            request.status = 'Cancelled';
            await request.save();

            // Re-enable provider
            if (request.providerId) {
                await User.findByIdAndUpdate(request.providerId, { isAvailable: true });
            }

            // Notify provider
            if (io && connectedProviders) {
                const provider = await User.findById(request.providerId);
                if (provider) {
                    const providerSocketId = connectedProviders.get(provider.uid);
                    if (providerSocketId) {
                        io.to(providerSocketId).emit('counter_rejected', {
                            requestId: request._id
                        });
                    }
                }
            }
        }

        res.status(200).json({ success: true, request });
    } catch (error) {
        console.error('Error responding to counter offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



exports.getProviderRequests = async (req, res) => {
    try {
        const providerId = req.user._id; 
        
        // Fetch requests assigned to this provider, maybe only active ones
        const requests = await ServiceRequest.find({ providerId })
            .sort({ createdAt: -1 });

        // Populate user details for each request
        const populatedRequests = await Promise.all(requests.map(async (reqItem) => {
            const user = await User.findOne({ uid: reqItem.userId });
            return {
                ...reqItem._doc,
                user: user ? { name: user.fullName, contact: user.contactNumber } : null
            };
        }));

        res.status(200).json({ success: true, requests: populatedRequests });
    } catch (error) {
        console.error('Error fetching provider requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Get Provider's Current Active Job
// @route   GET /api/services/active-job
// @access  Provider
exports.getActiveJob = async (req, res) => {
    try {
        const providerId = req.user._id; 
        
        // Find a job assigned to this provider that is 'Accepted' or 'In Progress'
        const activeRequest = await ServiceRequest.findOne({ 
            providerId,
            status: { $in: ['Accepted', 'In Progress'] }
        }).sort({ createdAt: -1 });

        if (!activeRequest) {
            return res.status(200).json({ success: true, request: null });
        }

        // Populate user details for the active request
        const user = await User.findOne({ uid: activeRequest.userId });
        const populatedRequest = {
            ...activeRequest._doc,
            user: user ? { name: user.fullName, contact: user.contactNumber } : null,
            userInfo: user ? { name: user.fullName, contactNumber: user.contactNumber } : null
        };

        res.status(200).json({ success: true, request: populatedRequest });
    } catch (error) {
        console.error('Error fetching active job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Get User's Current Active Job
// @route   GET /api/services/user/active-job
// @access  User
exports.getUserActiveJob = async (req, res) => {
    try {
        const userId = req.user.uid; 
        
        // Find a job created by this user that is 'Accepted' or 'In Progress'
        const activeRequest = await ServiceRequest.findOne({ 
            userId,
            status: { $in: ['Accepted', 'In Progress'] }
        }).sort({ createdAt: -1 });

        if (!activeRequest) {
            return res.status(200).json({ success: true, request: null });
        }

        // Populate provider details
        const provider = await User.findById(activeRequest.providerId);
        const populatedRequest = {
            ...activeRequest._doc,
            providerName: provider ? provider.fullName : 'Service Provider',
            providerPhone: provider ? provider.contactNumber : null,
            providerLocation: provider ? provider.currentLocation : null
        };

        res.status(200).json({ success: true, request: populatedRequest });
    } catch (error) {
        console.error('Error fetching user active job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Update Provider Location (used for 10-second real-time tracking)
// @route   PUT /api/services/provider/location
// @access  Provider
exports.updateProviderLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const providerId = req.user._id;

        // Update provider in User model
        const updatedProvider = await User.findByIdAndUpdate(
            providerId,
            { 'currentLocation.lat': lat, 'currentLocation.lng': lng },
            { new: true }
        );

        if (!updatedProvider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        // Emit through Socket.IO globally so users see markers move instantly
        const io = req.app.get('io');
        if (io) {
            io.emit('provider_location_updated', {
                providerId: providerId,
                lat: lat,
                lng: lng
            });
        }

        res.status(200).json({ success: true, message: 'Location updated locally and broadcasted' });
    } catch (error) {
        console.error('Error updating provider location:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Helper function to calculate distance using Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

exports.getNearbyProviders = async (req, res) => {
    try {
        const { serviceType, userLocation, searchRadius = 50 } = req.body; // searchRadius in miles

        if (!userLocation || !userLocation.lat || !userLocation.lng) {
            return res.status(400).json({ error: 'User location is required' });
        }

        // Mapping between service request names and provider signup slugs
        const serviceTypeMapping = {
            'Breakdown Repair': ['breakdown-assistance', 'breakdown repair', 'breakdown', 'mechanic'],
            'Fuel Delivery': ['fuel-delivery', 'fuel delivery', 'fuel'],
            'Lockout Service': ['lockout-service', 'lockout service', 'lockout', 'locksmith'],
            'Towing Service': ['towing-service', 'towing service', 'towing', 'tow'],
            'Temporary Driver': ['temporary-driver', 'temporary driver', 'driver'],
            'Route Planning': ['route-planning', 'route planning', 'route'],
        };

        // Get the possible matching slugs for the requested service type
        const matchingSlugs = serviceTypeMapping[serviceType] || [serviceType.toLowerCase()];

        const providers = await User.find({ 
            role: 'provider', 
            isAvailable: true,
        });

        const nearbyProviders = providers.map(provider => {
            if (!provider.currentLocation || !provider.currentLocation.lat) return null;

            const pService = (provider.providerDetails?.serviceType || '').toLowerCase();
            
            // Check if the provider's service matches any of the acceptable slugs
            const serviceMatches = matchingSlugs.some(slug => 
                pService.includes(slug.toLowerCase())
            );
            if (!serviceMatches) return null;

            const distance = getDistanceFromLatLonInKm(
                userLocation.lat, 
                userLocation.lng, 
                provider.currentLocation.lat, 
                provider.currentLocation.lng
            );

            // Convert km to miles for display if needed, or keep km
            // standard: 1 km = 0.621371 miles
            const distanceMiles = distance * 0.621371;

            if (distanceMiles <= searchRadius) {
                return {
                    id: provider._id,
                    name: provider.fullName,
                    service: pService,
                    rating: 4.8, // Mock rating for now
                    reviews: 0, // Mock reviews
                    distance: distanceMiles.toFixed(1) + ' miles',
                    eta: '~' + Math.ceil(distanceMiles * 3) + ' min', // Rough estimate: 20mph avg city speed -> 3 mins per mile
                    image: provider.providerDetails?.profileImage || 'https://via.placeholder.com/150',
                    lat: provider.currentLocation.lat,
                    lng: provider.currentLocation.lng,
                    contactNumber: provider.contactNumber,
                    petrolPrice: provider.providerDetails?.petrolPrice,
                    dieselPrice: provider.providerDetails?.dieselPrice
                };
            }
            return null;
        })
        .filter(p => p !== null)
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        res.status(200).json({ success: true, providers: nearbyProviders });

    } catch (error) {
        console.error('Error fetching nearby providers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Update Service Request status (Accept/Reject)
// @route   PUT /api/services/request/:id/status
// @access  Provider
exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Accepted', 'Rejected', 'Completed', 'Cancelled'
        const userId = req.user._id;

        if (!['Accepted', 'Rejected', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const request = await ServiceRequest.findById(id);

        if (!request) {
            return res.status(404).json({ error: 'Service request not found' });
        }

        // Authorization check
        if (status === 'Cancelled') {
            // Only the user who created the request can cancel it
            if (request.userId.toString() !== req.user.uid.toString()) {
                return res.status(403).json({ error: 'Not authorized to cancel this request' });
            }
        } else {
            // For Accepted, Rejected, Completed, only the assigned provider can update
            if (!request.providerId || request.providerId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'Not authorized to update this request' });
            }
        }

        request.status = status;

        // If provider accepts a user's counter offer
        if (status === 'Accepted' && request.negotiation && request.negotiation.offeredRate && !request.negotiation.finalRate) {
            request.negotiation.finalRate = request.negotiation.offeredRate;
        }

        await request.save();

        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        const connectedProviders = req.app.get('connectedProviders');

        // Update provider availability based on the new status
        if (status === 'Accepted') {
            await User.findByIdAndUpdate(request.providerId, { isAvailable: false });
            
            // Notify user that provider accepted
            const userSocketId = connectedUsers.get(request.userId.toString());
            if (io && userSocketId) {
                const provider = await User.findById(request.providerId);
                io.to(userSocketId).emit('job_accepted', {
                    requestId: request._id,
                    providerName: provider?.fullName || 'Service Provider'
                });
            }
        } else if (status === 'Completed') {
            await User.findByIdAndUpdate(request.providerId, { 
                isAvailable: true,
                $inc: { 'providerDetails.completedJobsCount': 1 }
            });

            // Notify user via Socket.IO when job is Completed
            const userSocketId = connectedUsers.get(request.userId.toString());
            if (io && userSocketId) {
                const provider = await User.findById(request.providerId);
                io.to(userSocketId).emit('job_completed', {
                    requestId: request._id,
                    providerId: request.providerId,
                    providerName: provider?.fullName || 'Service Provider',
                    serviceType: request.serviceType
                });
            }
        } else if (status === 'Rejected' || status === 'Cancelled') {
            if (request.providerId) {
                await User.findByIdAndUpdate(request.providerId, { isAvailable: true });
                
                // If provider rejected, notify user so they can pick someone else
                if (status === 'Rejected') {
                    const userSocketId = connectedUsers.get(request.userId.toString());
                    if (io && userSocketId) {
                        io.to(userSocketId).emit('job_rejected', {
                            requestId: request._id,
                            providerId: request.providerId
                        });
                    }
                }
                
                // If user cancelled, notify provider
                if (status === 'Cancelled') {
                    const provider = await User.findById(request.providerId);
                    if (provider) {
                        const providerSocketId = connectedProviders.get(provider.uid);
                        if (io && providerSocketId) {
                            io.to(providerSocketId).emit('job_cancelled', {
                                requestId: request._id
                            });
                        }
                    }
                }
            }
        }

        res.status(200).json({ success: true, message: `Request ${status.toLowerCase()}`, request });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Submit Rating and Issue Report for a completed job
// @route   POST /api/services/request/:id/rate
// @access  User
exports.submitRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { score, comment, issueReport } = req.body;

        const request = await ServiceRequest.findById(id);

        if (!request) {
            return res.status(404).json({ error: 'Service request not found' });
        }

        if (request.status !== 'Completed') {
            return res.status(400).json({ error: 'Can only rate completed jobs' });
        }

        // Save rating and issue report to the service request
        if (score) {
            request.rating = { score, comment };
        }
        if (issueReport) {
            request.issueReport = issueReport;
        }
        await request.save();

        // Update the provider's overall rating stats
        if (score) {
            const provider = await User.findById(request.providerId);
            if (provider) {
                const currentTotalScore = (provider.providerDetails.averageRating || 0) * (provider.providerDetails.totalRatings || 0);
                const newTotalRatings = (provider.providerDetails.totalRatings || 0) + 1;
                const newAverageRating = (currentTotalScore + score) / newTotalRatings;

                provider.providerDetails.totalRatings = newTotalRatings;
                provider.providerDetails.averageRating = Number(newAverageRating.toFixed(2)); // Store with 2 decimal places

                await provider.save();
                console.log(`Updated Provider ${provider.fullName}'s overall rating: ${provider.providerDetails.averageRating} (${provider.providerDetails.totalRatings} reviews)`);
            }
        }

        res.status(200).json({ success: true, message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const Dispute = require('../models/Dispute');

// @desc    Submit a dispute/report for a service request
// @route   POST /api/services/request/:id/dispute
// @access  User
exports.submitDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, description, lat, lng } = req.body;

        const request = await ServiceRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: 'Service request not found' });
        }

        const dispute = new Dispute({
            userId: request.userId,
            providerId: request.providerId,
            serviceType: request.serviceType,
            serviceRequestId: id,
            reason,
            description,
            proofImage: req.file ? req.file.path : null,
            location: (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : request.userLocation
        });

        await dispute.save();

        res.status(201).json({ 
            success: true, 
            message: 'Report submitted successfully. Our team will review it.',
            dispute 
        });
    } catch (error) {
        console.error('Error submitting dispute:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Update service request details (service-specific info)
// @route   PUT /api/services/request/:id/details
// @access  User
exports.updateRequestDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { details } = req.body;

        if (!details) {
            return res.status(400).json({ error: 'Details are required' });
        }

        const request = await ServiceRequest.findById(id);

        if (!request) {
            return res.status(404).json({ error: 'Service request not found' });
        }

        // Merge or overwrite details
        request.details = { ...request.details, ...details };
        await request.save();

        res.status(200).json({ success: true, message: 'Request details updated successfully', request });
    } catch (error) {
        console.error('Error updating request details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Get NHA Travel Advisories via Python scraper
// @route   GET /api/services/nha-advisories
// @access  Private
exports.getNhaAdvisories = async (req, res) => {
    const scraperPath = path.join(__dirname, '..', '..', 'scraper', 'nha_scraper.py');

    try {
        const result = await new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [scraperPath]);
            let stdout = '';
            let stderr = '';

            // 30 second timeout
            const timeout = setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Scraper timed out after 30 seconds'));
            }, 30000);

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`Scraper exited with code ${code}: ${stderr}`));
                } else {
                    try {
                        const parsed = JSON.parse(stdout);
                        resolve(parsed);
                    } catch (parseErr) {
                        reject(new Error('Failed to parse scraper output: ' + stdout));
                    }
                }
            });

            pythonProcess.on('error', (err) => {
                clearTimeout(timeout);
                reject(new Error('Failed to start scraper: ' + err.message));
            });
        });

        if (result.success) {
            res.status(200).json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, error: result.error || 'Scraper failed' });
        }

    } catch (error) {
        console.error('NHA Scraper Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Testimonials (Service Requests with ratings)
// @route   GET /api/services/testimonials
// @access  Public
exports.getTestimonials = async (req, res) => {
    try {
        // Find service requests that have a rating score, sorted by newest
        const requests = await ServiceRequest.find({ 
            'rating.score': { $exists: true, $ne: null }
        })
        .sort({ createdAt: -1 })
        .limit(6); // Get up to 6 to make sure we have enough for a good scroll

        // Map to format for frontend
        const testimonials = await Promise.all(requests.map(async (reqItem) => {
            // Find provider using MongoDB _id from providerId field
            const provider = await User.findById(reqItem.providerId);
            
            return {
                id: reqItem._id,
                name: provider ? provider.fullName : 'Verified Provider',
                image: provider?.providerDetails?.profileImage || 'https://via.placeholder.com/150',
                rating: reqItem.rating?.score || 5,
                text: reqItem.rating?.comment || 'Exceptional service! Very satisfied with the outcome.',
                serviceType: reqItem.serviceType
            };
        }));

        res.status(200).json({ 
            success: true, 
            testimonials: testimonials.filter(t => t.text && t.text.length > 5) 
        });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

