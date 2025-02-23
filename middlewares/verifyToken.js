const verifyToken = (req, res, next) => {
    let token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) return res.status(403).json({ message: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid token" });

        req.admin = decoded; 
        next();
    });
};
