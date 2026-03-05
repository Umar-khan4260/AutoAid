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
        const { requestId, providerId } = req.body;
        
        if (!requestId || !providerId) {
            return res.status(400).json({ error: 'Request ID and Provider ID are required' });
        }

        const request = await ServiceRequest.findByIdAndUpdate(
            requestId, 
            { providerId }, 
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
            // Find provider's UID since our connectedProviders map uses uid, not _id
            const provider = await User.findById(providerId);
            if (provider) {
                const socketId = connectedProviders.get(provider.uid);
                if (socketId) {
                    io.to(socketId).emit('new_service_request', {
                        request,
                        user: user ? { name: user.fullName, contact: user.contactNumber } : null
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
                    contactNumber: provider.contactNumber
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
        const { status } = req.body; // 'Accepted', 'Rejected', 'Completed'
        const providerId = req.user._id;

        if (!['Accepted', 'Rejected', 'Completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const request = await ServiceRequest.findById(id);

        if (!request) {
            return res.status(404).json({ error: 'Service request not found' });
        }

        // Verify that this request belongs to this provider
        if (request.providerId.toString() !== providerId.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this request' });
        }

        request.status = status;
        await request.save();

        res.status(200).json({ success: true, message: `Request ${status.toLowerCase()}`, request });
    } catch (error) {
        console.error('Error updating request status:', error);
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
