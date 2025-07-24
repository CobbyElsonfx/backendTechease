const Agent = require('../models/Agent');
const Application = require('../models/Application');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // Check if email exists
    const existing = await Agent.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    // Generate unique referral code
    let referralCode;
    do {
      referralCode = Math.random().toString(36).substring(2, 10);
    } while (await Agent.findOne({ referralCode }));
    // Create agent
    const agent = new Agent({ name, email, password, referralCode });
    await agent.save();
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
    const token = jwt.sign({ id: agent._id, email: agent.email, role: 'agent' }, process.env.JWT_SECRET, { expiresIn: '24h' });
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
      commissionPaid: agent.commissionPaid,
      referrals
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