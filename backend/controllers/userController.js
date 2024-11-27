import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";
import crypto from 'crypto'

//API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate fields
    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Enter details in all fields",
      });
    }
    if (typeof password !== "string") {
      return res.json({ success: false, message: "Password must be a string" });
    }
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a strong password" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10); // Generates salt correctly
    if (!salt) {
      throw new Error("Failed to generate salt");
    }
    const hashedPassword = await bcrypt.hash(password, salt); // Hash password with valid salt

    // Save user data
    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

//API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API for fetching user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;
    if (!userId || !name || !phone || !address || !dob || !gender) {
      return res.json({
        success: false,
        message: "Enter details in all missing fields",
      });
    }
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address,
      dob,
      address: JSON.parse(address),
      dob,
      gender,
    });
    if (imageFile) {
      //upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }
    res.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API for booking appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData.available) {
      return res.json({ success: false, message: "Doctor not available" });
    }
    let slots_booked = docData.slots_booked;

    //Checking for available slots
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot not available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }
    const userData = await userModel.findById(userId).select("-password");
    delete docData.slots_booked;
    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    //Save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get user appointments
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    //Verifying appointment user
    if (appointmentData.userId !== userId) {
      return res.json({ succes: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    //Releasing doctor's slot
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;
    console.log("slots booked : ", slots_booked);
    console.log(
      "filtered: ",
      slots_booked[slotDate].filter((e) => e !== slotTime)
    );

    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );
    console.log("After filtereation : ", slots_booked[slotDate]);
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//API to verify razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { 
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature 
    } = req.body;

    console.log('Starting payment verification for:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id
    });

    // 1. First verify the signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.log('Signature verification failed');
      return res.json({ 
        success: false, 
        message: "Payment verification failed - invalid signature" 
      });
    }

    // 2. Fetch payment details first
    const paymentInfo = await razorpayInstance.payments.fetch(razorpay_payment_id);
    console.log('Payment Info:', paymentInfo);

    // 3. Check payment status and handle accordingly
    if (paymentInfo.status === 'authorized') {
      console.log('Payment authorized, attempting capture...');
      try {
        // Attempt to capture the payment
        const captureResponse = await razorpayInstance.payments.capture(
          razorpay_payment_id,
          paymentInfo.amount,
          paymentInfo.currency
        );
        console.log('Capture response:', captureResponse);
        
        // Update payment info after capture
        const updatedPaymentInfo = await razorpayInstance.payments.fetch(razorpay_payment_id);
        console.log('Updated payment info after capture:', updatedPaymentInfo);

        if (updatedPaymentInfo.status === 'captured') {
          // Fetch order details
          const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
          
          // Update appointment
          await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
            payment: true,
          });

          return res.json({
            success: true,
            message: "Payment successful and captured",
            paymentDetails: updatedPaymentInfo
          });
        }
      } catch (captureError) {
        console.error('Capture failed:', captureError);
        return res.json({
          success: false,
          message: "Payment capture failed: " + captureError.message
        });
      }
    } else if (paymentInfo.status === 'captured') {
      // Payment was already captured
      const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
      
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paymentStatus: 'completed',
        paymentDetails: paymentInfo
      });

      return res.json({
        success: true,
        message: "Payment Successfull",
        paymentDetails: paymentInfo
      });
    } else {
      console.log('Payment in invalid state:', paymentInfo.status);
      return res.json({
        success: false,
        message: `Payment is in invalid state: ${paymentInfo.status}`,
        paymentDetails: paymentInfo
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.json({
      success: false,
      message: "Payment verification failed: " + error.message,
      error: error.stack
    });
  }
};

// Update the payment creation to ensure automatic capture is enabled
const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Invalid or cancelled appointment"
      });
    }

    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY || 'INR',
      receipt: appointmentId,
      payment_capture: 1,
      notes: {
        appointmentId: appointmentId
      }
    };

    console.log('Creating Razorpay order with options:', options);
    const order = await razorpayInstance.orders.create(options);
    console.log('Razorpay order created:', order);

    res.json({ 
      success: true, 
      order,
      message: "Order created successfully"
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.json({
      success: false,
      message: "Failed to create order: " + error.message
    });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
};
