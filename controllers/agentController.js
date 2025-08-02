const Agent = require('../models/Agent');
const Application = require('../models/Application');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendPartnerWelcomeEmail } = require('../utils/emailService');

// Function to generate referral code suggestions
const generateReferralCodeSuggestions = async (name) => {
  const suggestions = [];
  const nameParts = name.trim().split(' ').filter(part => part.length > 0);
  
  // Get first name and last name
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';
  
  // Generate 3 unique suggestions
  for (let i = 0; i < 3; i++) {
    let suggestion;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      attempts++;
      const randomNum = Math.floor(Math.random() * 999) + 1;
      
      // Different patterns for variety
      switch (i) {
        case 0:
          // Pattern: FirstName + RandomNumber (e.g., John123)
          suggestion = `${firstName}${randomNum}`;
          break;
        case 1:
          // Pattern: FirstName + LastName + RandomNumber (e.g., JohnDoe456)
          suggestion = `${firstName}${lastName}${randomNum}`;
          break;
        case 2:
          // Pattern: FirstName + RandomNumber + LastName (e.g., John789Doe)
          suggestion = `${firstName}${randomNum}${lastName}`;
          break;
        default:
          suggestion = `${firstName}${randomNum}`;
      }
      
      // Clean the suggestion (remove special characters, make uppercase)
      suggestion = suggestion.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      
      // Ensure it's at least 6 characters
      if (suggestion.length < 6) {
        suggestion = suggestion + Math.floor(Math.random() * 999) + 1;
      }
      
      // Limit to 12 characters
      if (suggestion.length > 12) {
        suggestion = suggestion.substring(0, 12);
      }
      
    } while (await Agent.findOne({ referralCode: suggestion }) && attempts < maxAttempts);
    
    // If we found a unique suggestion, add it
    if (attempts < maxAttempts) {
      suggestions.push(suggestion);
    }
  }
  
  return suggestions;
};

exports.getReferralCodeSuggestions = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Name is required to generate referral code suggestions' 
      });
    }
    
    const suggestions = await generateReferralCodeSuggestions(name);
    
    if (suggestions.length === 0) {
      return res.status(500).json({ 
        message: 'Unable to generate unique referral code suggestions' 
      });
    }
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if email exists
    const existing = await Agent.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    
    // Validate referral code if provided
    if (referralCode) {
      // Check if referral code already exists
      const existingCode = await Agent.findOne({ referralCode });
      if (existingCode) {
        return res.status(409).json({ message: 'Referral code already taken. Please choose another one.' });
      }
      
      // Validate referral code format (alphanumeric, 6-12 characters)
      if (!/^[A-Z0-9]{6,12}$/.test(referralCode)) {
        return res.status(400).json({ 
          message: 'Referral code must be 6-12 characters long and contain only letters and numbers' 
        });
      }
    } else {
      // Generate unique referral code if not provided
      let generatedCode;
      do {
        generatedCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      } while (await Agent.findOne({ referralCode: generatedCode }));
      referralCode = generatedCode;
    }
    
    // Create agent
    const agent = new Agent({ name, email, password, referralCode });
    await agent.save();
    
    // Send welcome email to the new partner
    try {
      await sendPartnerWelcomeEmail({
        to: email,
        name: name,
        referralCode: referralCode
      });
      console.log('Partner welcome email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send partner welcome email:', emailError);
      // Don't fail the registration if email fails
    }
    
    res.status(201).json({ message: 'Agent registered successfully', referralCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const agent = await Agent.findOne({ email });
    if (!agent) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isValid = await bcrypt.compare(password, agent.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: agent._id, email: agent.email, role: 'agent' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, agent: { id: agent._id, name: agent.name, email: agent.email, referralCode: agent.referralCode } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const agentId = req.user.id;
    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    // Get all applications referred by this agent
    const referrals = await Application.find({ agent: agentId });
    res.json({
      totalReferrals: referrals.length,
      totalCommission: agent.totalCommission,
      paidCommission: agent.paidCommission || 0,
      leftCommission: (agent.totalCommission || 0) - (agent.paidCommission || 0),
      commissionPaid: agent.commissionPaid,
      referrals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Pay commission to agent
exports.payCommission = async (req, res) => {
  try {
    const { agentId, amount } = req.body;
    if (!agentId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid agentId or amount' });
    }
    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    agent.paidCommission = (agent.paidCommission || 0) + amount;
    await agent.save();
    res.json({
      message: 'Commission paid successfully',
      paidCommission: agent.paidCommission,
      leftCommission: (agent.totalCommission || 0) - (agent.paidCommission || 0),
      agentId: agent._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAgents = async (req, res) => {
  try {
    // Only allow admin (add your admin check here if needed)
    const agents = await Agent.find({}, 'name email referralCode totalReferrals totalCommission commissionPaid');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agents', error: error.message });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const agent = await Agent.findById(req.user.id);
    
    if (!agent) {
      return res.status(401).json({ message: 'Agent not found' });
    }

    res.json({
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        referralCode: agent.referralCode
      }
    });
  } catch (error) {
    console.error('Agent token verification error:', error);
    res.status(500).json({ message: 'Error verifying token' });
  }
}; 