const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

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
