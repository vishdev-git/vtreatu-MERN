import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";



const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const appointmentsPerPage = 3;

  const months = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return (
      dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    );
  };

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });
      if (data.success) {
        setAppointments(data.appointments.reverse());
        console.log(data.appointments)
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/cancel-appointments",
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Appointment Payment",
      description: "Appointment Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        console.log('Payment response received:', response);
        try {
          // Show loading state
          toast.info('Verifying payment...', { autoClose: false, toastId: 'verifying' });
  
          const { data } = await axios.post(
            backendUrl + "/api/user/verify-razorpay",
            response,
            { 
              headers: { token },
              timeout: 10000 // 10 second timeout
            }
          );
  
          // Remove loading toast
          toast.dismiss('verifying');
  
          console.log('Payment verification response:', data);
  
          if (data.success) {
            toast.success(data.message);
            getUserAppointments();
            navigate('/my-appointments');
          } else {
            console.error('Payment verification failed:', data);
            toast.error(data.message || 'Payment verification failed');
            
            // If payment needs attention, provide clear guidance
            if (data.paymentDetails?.status === 'authorized') {
              toast.info('Your payment is authorized but needs to be processed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
            }
          }
        } catch (error) {
          toast.dismiss('verifying');
          console.error('Payment verification error:', error);
          toast.error('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
        }
      },
      modal: {
        ondismiss: function() {
          toast.info('Payment window closed. If you completed the payment, please wait for verification.');
        }
      },
      prefill: {
        name: "Patient Name",    // You can add these from user context
        email: "patient@example.com",
        contact: "9999999999"
      },
      notes: {
        description: "Appointment Payment"
      },
      theme: {
        color: "#3399cc"
      }
    };
  
    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      toast.error(`Payment failed: ${response.error.description}`);
    });
  
    rzp.open();
  };

  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/payment-razorpay",
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        initPay(data.order);
       
      }else{
        console.log('initPay verification failed')
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);

  // Pagination logic
  const lastAppointmentIndex = currentPage * appointmentsPerPage;
  const firstAppointmentIndex = lastAppointmentIndex - appointmentsPerPage;
  const currentAppointments = appointments.slice(
    firstAppointmentIndex,
    lastAppointmentIndex
  );

  const totalPages = Math.ceil(appointments.length / appointmentsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b ">
        My Appointments
      </p>
      <div>
        {currentAppointments.map((item, index) => (
          <div
            className="grid gid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
            key={index}
          >
            <div>
              <img
                className="w-32 bg-indigo-50"
                src={item.docData.image}
                alt=""
              />
            </div>
            <div className="flex-1 text-sm text-zinc-600">
              <p className="text-neutral-800 font-semibold">
                {item.docData.name}
              </p>
              <p>{item.docData.speciality}</p>
              <p className="text-zinc-700 font-medium mt-1">Address:</p>
              <p className="text-xs">{item.docData.address.line1}</p>
              <p className="text-xs">{item.docData.address.line2}</p>
              <p className="text-xs mt-1">
                <span className="text-sm text-neutral-700 font-medium">
                  Date & Time:{" "}
                </span>{" "}
                {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>
            </div>
            <div></div>
            <div className="flex flex-col gap-2 justify-end">
              {!item.cancelled && item.payment &&!item.isCompleted &&  <button className="sm:min-w-48 py-2 border rounded text-stone-500 bg-indigo-50" >Paid</button>}
              {!item.cancelled && !item.payment && !item.isCompleted && (
                <button
                  onClick={() => appointmentRazorpay(item._id)}
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Pay Online
                </button>
              )}
              {!item.cancelled && !item.isCompleted &&(
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  Cancel Appointment
                </button>
              )}
              {item.cancelled && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500 text-sm">
                  Appointment cancelled
                </button>
              )}
              {item.isCompleted && <button className="min-w-48 py-2 border border-green-500 rounded text-green-500">Completed</button>}
            </div>
          </div>
        ))}
      </div>
      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 border rounded ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-black"
          }`}
        >
          Previous
        </button>
        <p className="text-sm">
          Page {currentPage} of {totalPages}
        </p>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 border ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-black"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MyAppointments;
