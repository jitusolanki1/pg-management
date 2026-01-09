/**
 * Public PG Landing Page
 * Premium, trust-building design - NO admin visibility
 */

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

// PG Photos - Replace with actual images
const pgPhotos = [
    { id: 1, url: "/images/pg-room-1.jpg", alt: "Spacious AC Room" },
    { id: 2, url: "/images/pg-room-2.jpg", alt: "Common Area" },
    { id: 3, url: "/images/pg-room-3.jpg", alt: "Kitchen Facility" },
    { id: 4, url: "/images/pg-room-4.jpg", alt: "Bathroom" },
]

// PG Features
const features = [
    { icon: "🛏️", title: "Furnished Rooms", desc: "AC & Non-AC options available" },
    { icon: "🍽️", title: "Meal Plans", desc: "Full & Half meal options" },
    { icon: "📶", title: "High-Speed WiFi", desc: "Unlimited internet access" },
    { icon: "🧹", title: "Daily Cleaning", desc: "Housekeeping included" },
    { icon: "🔒", title: "24/7 Security", desc: "CCTV & security guard" },
    { icon: "🚿", title: "Hot Water", desc: "24 hours availability" },
]

// Room Types
const roomTypes = [
    { type: "Single Sharing", price: "₹8,000", features: ["AC Room", "Attached Bath", "Study Table"] },
    { type: "Double Sharing", price: "₹6,000", features: ["AC Room", "Shared Bath", "Wardrobe"] },
    { type: "Triple Sharing", price: "₹5,000", features: ["Non-AC", "Shared Bath", "Basic Furniture"] },
]

export default function LandingPage() {
    const navigate = useNavigate()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [footerClickCount, setFooterClickCount] = useState(0)
    const [showContactModal, setShowContactModal] = useState(false)
    const clickTimeoutRef = useRef(null)

    // Auto-rotate carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % pgPhotos.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    // Hidden admin entry - 10 clicks on footer
    const handleFooterClick = () => {
        // Clear any existing timeout
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current)
        }

        setFooterClickCount(prev => {
            const newCount = prev + 1
            console.log(`🔐 Hidden click: ${newCount}/10`) // Debug log

            if (newCount >= 10) {
                // Navigate to admin login WITH hidden entry state
                navigate("/admin-login", {
                    state: {
                        fromHiddenEntry: true,
                        timestamp: Date.now()
                    }
                })
                return 0
            }
            return newCount
        })

        // Reset count after 5 seconds of no clicks
        clickTimeoutRef.current = setTimeout(() => {
            setFooterClickCount(0)
        }, 5000)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current)
            }
        }
    }, [])

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                M
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900 text-lg">Mahavir PG</h1>
                                <p className="text-xs text-gray-500">Premium Paying Guest</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <a href="tel:+919876543210" className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-sm font-medium">+91 98765 43210</span>
                            </a>
                            <button
                                onClick={() => navigate("/register")}
                                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                            >
                                Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section with Carousel */}
            <section className="relative h-[70vh] min-h-[500px] bg-gray-900 overflow-hidden">
                {/* Background Images */}
                <div className="absolute inset-0">
                    {pgPhotos.map((photo, index) => (
                        <div
                            key={photo.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10" />
                            <img
                                src={photo.url}
                                alt={photo.alt}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = `https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&q=80`
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Hero Content */}
                <div className="relative z-20 h-full flex items-center">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="max-w-2xl">
                            <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full mb-6 border border-white/20">
                                🏠 Premium PG in City Center
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                                Your Home Away<br />From Home
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-200 mb-8 leading-relaxed">
                                Experience comfortable living with modern amenities, homely food, and a caring environment.
                                Perfect for students and working professionals.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => navigate("/register")}
                                    className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-xl text-lg"
                                >
                                    Register for PG
                                </button>
                                <button
                                    onClick={() => setShowContactModal(true)}
                                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all text-lg"
                                >
                                    Contact Us
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {pgPhotos.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "w-8 bg-white" : "bg-white/50"
                                }`}
                        />
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Mahavir PG?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We provide a safe, comfortable, and home-like environment with all modern amenities
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 text-center group"
                            >
                                <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </span>
                                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                                <p className="text-sm text-gray-500">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Room Types Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Room Options
                        </h2>
                        <p className="text-lg text-gray-600">
                            Choose the perfect accommodation that suits your needs
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {roomTypes.map((room, index) => (
                            <div
                                key={index}
                                className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-xl ${index === 1 ? "border-indigo-500 shadow-lg" : "border-gray-200"
                                    }`}
                            >
                                {index === 1 && (
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                                        Popular
                                    </div>
                                )}
                                <div className="p-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{room.type}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-3xl font-bold text-indigo-600">{room.price}</span>
                                        <span className="text-gray-500">/month</span>
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {room.features.map((feat, i) => (
                                            <li key={i} className="flex items-center gap-3 text-gray-600">
                                                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => navigate("/register")}
                                        className={`w-full py-3 rounded-xl font-semibold transition-all ${index === 1
                                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                            }`}
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Take a Tour
                        </h2>
                        <p className="text-lg text-gray-600">
                            See our comfortable rooms and facilities
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <div
                                key={num}
                                className={`relative rounded-xl overflow-hidden ${num === 1 || num === 6 ? "md:col-span-2 md:row-span-2" : ""
                                    }`}
                            >
                                <img
                                    src={`https://images.unsplash.com/photo-${1522771739844 + num * 1000}-6a9f6d5f14af?w=600&q=80`}
                                    alt={`PG Gallery ${num}`}
                                    className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        e.target.src = `https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80`
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                                Prime Location
                            </h2>
                            <p className="text-lg text-gray-600 mb-8">
                                Located in the heart of the city with easy access to public transport,
                                markets, hospitals, and educational institutions.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { icon: "🚇", text: "5 min walk to Metro Station" },
                                    { icon: "🏥", text: "2 km from City Hospital" },
                                    { icon: "🛒", text: "Walking distance to Market" },
                                    { icon: "🎓", text: "Near major colleges & offices" },
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="text-gray-700">{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 bg-indigo-50 rounded-2xl">
                                <h4 className="font-semibold text-gray-900 mb-2">📍 Address</h4>
                                <p className="text-gray-600">
                                    123, Main Road, Near Metro Station,<br />
                                    City Center, State - 123456
                                </p>
                            </div>
                        </div>

                        <div className="h-[400px] bg-gray-200 rounded-2xl overflow-hidden">
                            {/* Replace with actual Google Maps embed */}
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.7015927012073!2d72.51367307527584!3d23.033434915676946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84f521640d31%3A0x4e18f22a3f4c6e30!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1709654321098!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="PG Location"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Ready to Move In?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-10">
                        Register now and secure your spot. Limited rooms available!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate("/register")}
                            className="px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl text-lg"
                        >
                            Register Now - It's Free
                        </button>
                        <a
                            href="tel:+919876543210"
                            className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all text-lg"
                        >
                            📞 Call: +91 98765 43210
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer - Contains Hidden Admin Entry */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                                    M
                                </div>
                                <h3 className="font-bold text-white text-lg">Mahavir PG</h3>
                            </div>
                            <p className="text-sm leading-relaxed mb-6">
                                Providing comfortable and affordable accommodation for students
                                and working professionals since 2015.
                            </p>
                            <div className="flex gap-4">
                                {["facebook", "instagram", "twitter"].map((social) => (
                                    <a
                                        key={social}
                                        href={`https://${social}.com`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                                    >
                                        <span className="text-lg">
                                            {social === "facebook" && "📘"}
                                            {social === "instagram" && "📸"}
                                            {social === "twitter" && "🐦"}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Rooms & Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Facilities</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <span>📞</span>
                                    <a href="tel:+919876543210" className="hover:text-white transition-colors">
                                        +91 98765 43210
                                    </a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>✉️</span>
                                    <a href="mailto:info@mahavirpg.com" className="hover:text-white transition-colors">
                                        info@mahavirpg.com
                                    </a>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span>📍</span>
                                    <span>123, Main Road, City Center</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm">
                            <span
                                onClick={handleFooterClick}
                                className="cursor-default select-none"
                                style={{ userSelect: 'none' }}
                            >
                                2025 © Mahavir PG
                            </span>
                            . All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowContactModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Contact Us</h3>
                        <p className="text-gray-600 mb-6">Get in touch for any queries or to schedule a visit</p>

                        <div className="space-y-4">
                            <a
                                href="tel:+919876543210"
                                className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                            >
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                                    📞
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Call Now</div>
                                    <div className="text-sm text-gray-600">+91 98765 43210</div>
                                </div>
                            </a>

                            <a
                                href="https://wa.me/919876543210"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                            >
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl">
                                    💬
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">WhatsApp</div>
                                    <div className="text-sm text-gray-600">Chat with us</div>
                                </div>
                            </a>

                            <a
                                href="mailto:info@mahavirpg.com"
                                className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                            >
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                                    ✉️
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Email</div>
                                    <div className="text-sm text-gray-600">info@mahavirpg.com</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
