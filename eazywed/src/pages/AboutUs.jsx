import Navbar from "./common/Navbar";
import Footer from "./common/Footer";
import VendorCard from "./common/VendorCard";
import EstimateSidebar from "./common/EstimateSidebar";
import "./AboutUs.css";

// Import images from assets
import aboutUsHeader from "../assets/images/about-us-header.svg";
import whoAreWe from "../assets/images/who-are-we.png";
import aboutUsComputer from "../assets/images/about-us-computer.jpeg";

const AboutUs = () => {
  const vendorCategories = [
    { name: "PHOTOGRAPHER", icon: "fa-camera", path: "/services?category=Photographers" },
    { name: "BRIDAL MAKEUP", icon: "fa-paint-brush", path: "/services?category=Bridal Makeup" },
    { name: "WEDDING VENUE", icon: "fa-building", path: "/services?category=Wedding Venues" },
    { name: "HENNA ARTIST", icon: "fa-hand-paper", path: "/services?category=Henna Artists" },
  ];

  return (
    <div className="about-us-page">
      <Navbar />
      <EstimateSidebar />
      <div className="hero-section about-us-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-dark">Goodbye Worries,</span>
            <span className="hero-title-pink">Hello Memories</span>
          </h1>
        </div>
        <div className="hero-image">
          <img src={aboutUsHeader} alt="Couple on bench" />
        </div>
      </div>

      <div className="tagline-section">
        <p>
          Browse Pakistan's largest collection of wedding photographers, bridal makeup artists, and venues
          <br />
          to make your shaadi easy and stressless.
        </p>
      </div>

      <div className="who-we-are-section">
        <div className="who-we-are-content">
          <h2 className="section-title">Who Are We</h2>
          <p>
            Changemakers who understand your organizing pains better than Panadol and have curated the perfect solution
            for you.
          </p>
        </div>
        <div className="who-we-are-images">
          <div className="image-container who-are-we-image">
            <img src={whoAreWe} alt="Who We Are" />
          </div>
        </div>
      </div>

      <div className="business-section">
        <div className="business-image">
          <img src={aboutUsComputer} alt="Laptop" />
        </div>
        <div className="business-content">
          <h2 className="section-title">Grow Your Business!</h2>
          <p>Showcase your business like never before and unlock its full potential with our platform, today.</p>
          <div className="vendor-cards-container">
            {vendorCategories.map((category, index) => (
              <VendorCard key={index} name={category.name} icon={category.icon} path={category.path} />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;