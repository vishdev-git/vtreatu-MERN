import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <div className="flex flex-col gap-14 my-10 mt-40 text-sm">
      <div className="grid sm:grid-cols-[3fr_1fr_1fr] gap-10">
        {/* Left section */}
        <div>
          <img className="mb-5 w-40" src={assets.logo} alt="Company logo" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            Your health, our priority. Book doctor appointments easily and
            manage your medical care from the comfort of your home. For
            assistance, please contact our support team.
          </p>
        </div>
        {/* Center section */}
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>Home</li>
            <li>About Us</li>
            <li>Contact Us</li>
            <li>Privacy and Policy</li>
          </ul>
        </div>
        {/* Right section */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>+91 7306127672</li>
            <li>vtreatu@gmail.com</li>
          </ul>
        </div>
      </div>
      {/* Copyright Text */}
      <div className="text-center text-gray-600">
        <hr className="mb-5" />
        <p className="py-5 text-sm text-center">© 2024 All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
