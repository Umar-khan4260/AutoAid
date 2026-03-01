const ContactMessage = require('../models/ContactMessage');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
exports.submitContactMessage = async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const contactMessage = new ContactMessage({
            name,
            email,
            subject,
            message,
        });

        await contactMessage.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: contactMessage,
        });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
exports.getContactMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
