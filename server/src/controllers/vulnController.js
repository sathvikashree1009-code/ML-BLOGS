const { vulnScan } = require('../services/mlService');

exports.scan = async (req, res, next) => {
  try {
    const { code, markdown } = req.body;
    if (!code && !markdown) return res.status(400).json({ message: 'code or markdown required' });
    const result = await vulnScan({ code, markdown });
    res.json(result);
  } catch (err) {
    next(err);
  }
};