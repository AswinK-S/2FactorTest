const OTPAuth = require("otpauth");
const base32 = require('base32.js');
const encode = require("hi-base32");
const QRCode = require('qrcode');
const crypto =require('crypto')


const generateBase32Secret = () => {
    const buffer = crypto.randomBytes(15);
    const base32Encoded = base32.encode(buffer);
    return base32Encoded.replace(/=/g, "").substring(0, 24); // Ensure it’s a valid length
};

const users = [{
    "id":"01",
    "username":"user1",
    "password":"12345"

}];


exports.register = async (req, res) => {
    try {
        console.log('register')
        const { username, password } = req.body;
        const id = users.length + 1;

        // Store user information securely, including the user's password
        users.push({ id, username, password });
        res.status(201).send({
            status: "success",
            message: "User created successfully"
        });

    } catch (error) {
        console.log('error', error.message)
    }
}

//get the qr code
exports.twoFactor = async (req, res) => {
    const { username } = req.body;

    // Find the user by username
    const user = users.find((u) => u.username === username);

    if (!user) {
        return res.status(404).send('User not found');
    }

    // Generate a secret key for the user
    const base32_secret = generateBase32Secret();
    user.secret = base32_secret;

    // Generate a QR code URL for the user to scan
    let totp = new OTPAuth.TOTP({
        issuer: "YourSite.com",
        label: "YourSite",
        algorithm: "SHA1",
        digits: 6,
        secret: base32_secret,
    });

    let otpauth_url = totp.toString();

    // Generate and send the QR code as a response
    QRCode.toDataURL(otpauth_url, (err, qrUrl) => {
        if (err) {
            return res.status(500).json({
                status: 'fail',
                message: "Error while generating QR Code"
            });
        }
        res.json({
            status: "success",
            data: {
                qrCodeUrl: qrUrl,
                secret: base32_secret
            }
        });
    });
};


// verify 2fa code 
exports.verify2fa = async (req, res) => {
    const { username, token } = req.body;

    // Find the user by username
    const user = users.find((u) => u.username === username);

    if (!user) {
        return res.status(404).send('User not found');
    }

    // Verify the token
    let totp = new OTPAuth.TOTP({
        issuer: "http://localhost:3000/",
        label: "YourSite",
        algorithm: "SHA1",
        digits: 6,
        secret: user.secret,
    });

    let delta = totp.validate({ token });

    if (delta) {
        res.json({
            status: "success",
            message: "Authentication successful"
        })
    } else {
        res.status(401).json({
            status: "fail",
            message: "Authentication failed"
        })
    }
}


exports.home = async (req, res) => {
    res.send('Two Factor Authentication Example');
    res.json({ message: 'home' })
};
