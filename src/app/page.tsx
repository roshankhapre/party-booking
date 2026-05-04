import Link from 'next/link';

export default function Home() {
  const partyTypes = [
    { title: "Birthday", emoji: "🎂", desc: "Unforgettable birthdays with customized decor." },
    { title: "Kitty Party", emoji: "👩‍👩‍👧", desc: "Fun-filled afternoons with great food and laughter." },
    { title: "Engagement", emoji: "💍", desc: "Start your forever with the city skyline as your backdrop." },
    { title: "Haldi", emoji: "💛", desc: "Vibrant and traditional celebrations." },
    { title: "Mundan", emoji: "✂️", desc: "Auspicious beginnings with blessings and joy." },
    { title: "Anniversary", emoji: "❤️", desc: "Romantic setups to celebrate your milestones." },
    { title: "Corporate", emoji: "💼", desc: "Professional and elegant spaces for team outings." },
    { title: "Kids Party", emoji: "🎈", desc: "Joyful and exciting themes for the little ones." },
    { title: "Dal Bati Special", emoji: "🍛", desc: "Authentic and traditional Rajasthani feast." },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-700/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center mt-12">
          <div className="px-6 py-2 border border-amber-500/30 rounded-full text-amber-500 font-medium tracking-widest text-sm uppercase mb-8 bg-amber-500/5 backdrop-blur-sm">
            5-Star Rooftop Experience
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl leading-tight">
            K's Darshan Cafe <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600">
              & Restaurant
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Indore's Premier Rooftop Destination for Unforgettable Celebrations. Exquisite dining, breathtaking views, and world-class ambiance.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto">
            <Link href="/booking/new" className="px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 rounded-full font-bold text-lg hover:from-amber-400 hover:to-amber-500 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] text-center flex items-center justify-center gap-2">
              Book Your Party <span className="text-xl">✨</span>
            </Link>
            <Link href="/packages" className="px-10 py-5 bg-zinc-900/50 text-amber-500 border border-amber-500/30 rounded-full font-bold text-lg hover:bg-amber-500/10 transition-all hover:scale-105 backdrop-blur-md text-center">
              View Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Party Types Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Celebrate Every Occasion</h2>
          <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light">From intimate gatherings to grand celebrations, our venue is perfectly tailored for your special day.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {partyTypes.map((party, i) => (
            <div key={i} className="group p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 shadow-lg hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2 hover:bg-zinc-800/80 hover:border-amber-500/30 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-zinc-700/50 group-hover:border-amber-500/50 text-3xl">
                {party.emoji}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-zinc-100 group-hover:text-amber-400 transition-colors">{party.title}</h3>
              <p className="text-zinc-400 leading-relaxed font-light">{party.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-zinc-900/30 border-y border-zinc-800/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Why Choose Us</h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { title: "Prime Location", desc: "Located in the heart of Indore with easy access and ample parking.", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", innerIcon: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
              { title: "Stunning Views", desc: "Panoramic skyline views that turn every photo into a masterpiece.", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", innerIcon: "" },
              { title: "Gourmet Catering", desc: "Curated multi-cuisine menus prepared by top-tier chefs.", icon: "M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z", innerIcon: "" },
              { title: "Hassle-Free", desc: "End-to-end event management so you can focus on making memories.", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", innerIcon: "" },
            ].map((feature, i) => (
              <div key={i} className="text-center group">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 text-amber-500 flex items-center justify-center rounded-full mb-8 group-hover:-translate-y-3 transition-all duration-500 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_40px_-5px_rgba(245,158,11,0.4)]">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                    {feature.innerIcon && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.innerIcon} />}
                  </svg>
                </div>
                <h4 className="text-2xl font-bold mb-4 text-zinc-100">{feature.title}</h4>
                <p className="text-zinc-400 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 pt-20 pb-10 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-16 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-black text-white mb-6 tracking-tight">K's Darshan Cafe</h3>
              <p className="text-zinc-400 font-light leading-relaxed">Elevating dining and celebrations in Indore with premium rooftop experiences.</p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-amber-500">Contact Us</h4>
              <ul className="space-y-4 text-zinc-400 font-light">
                <li>📍 Rooftop, Scheme 54 PU4, Indore</li>
                <li>📞 +91 98765 43210</li>
                <li>✉️ info@ksdarshancafe.com</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-amber-500">Quick Links</h4>
              <ul className="space-y-4 text-zinc-400 font-light">
                <li><Link href="/packages" className="hover:text-amber-400 transition-colors">Our Packages</Link></li>
                <li><Link href="/booking/new" className="hover:text-amber-400 transition-colors">Book a Party</Link></li>
                <li><Link href="/admin/login" className="hover:text-amber-400 transition-colors">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800/50 text-center text-zinc-500 font-light text-sm">
            <p>&copy; {new Date().getFullYear()} K's Darshan Cafe & Restaurant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
