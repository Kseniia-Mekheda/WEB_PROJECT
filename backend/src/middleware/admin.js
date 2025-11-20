const requireSuperUser = (req, res, next) => {
    if (!req.user || !req.user.isSuperUser) {
        return res.status(403).json({ message: 'Forbidden: superuser only' });
    }
    next();
};

module.exports = { requireSuperUser };