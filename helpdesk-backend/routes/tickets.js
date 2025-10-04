const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/tickets
// @desc    Get all tickets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/tickets/:id
// @desc    Get ticket by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name');
    
    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Ticket not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/tickets
// @desc    Create a ticket
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, description, priority } = req.body;

  try {
    const newTicket = new Ticket({
      title,
      description,
      priority: priority || 'Medium',
      createdBy: req.user.id
    });

    const ticket = await newTicket.save();
    
    const populatedTicket = await Ticket.findById(ticket.id)
      .populate('createdBy', 'name email');
    
    res.json(populatedTicket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/tickets/:id
// @desc    Update ticket
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { title, description, status, priority, assignedTo } = req.body;

  try {
    let ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (status) updateFields.status = status;
    if (priority) updateFields.priority = priority;
    if (assignedTo) updateFields.assignedTo = assignedTo;

    ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('assignedTo', 'name email');

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Ticket not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete ticket
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    await ticket.remove();
    res.json({ msg: 'Ticket removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Ticket not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/tickets/:id/comments
// @desc    Add comment to ticket
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
  const { text } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    const user = await User.findById(req.user.id).select('name');

    const newComment = {
      user: req.user.id,
      userName: user.name,
      text
    };

    ticket.comments.push(newComment);
    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name');

    res.json(updatedTicket);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Ticket not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;

