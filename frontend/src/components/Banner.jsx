import { assets } from "../assets/assets"


const Banner = () => {
  return (
    <div>
      {/* Left side */}
      <div>
        <div>
            <p>Book Appointment</p>
            <p>With 100+ Trusted Doctors</p>
            <button>Create account</button>
        </div>
      </div>

      {/* Right side */}
      <div>
        <img src={assets.appointment_img} alt="" />
      </div>
    </div>
  )
}

export default Banner
