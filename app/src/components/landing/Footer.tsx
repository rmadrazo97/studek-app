"use client";

import { motion } from "framer-motion";
import { Sparkles, Twitter, Github, Linkedin, Mail, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Compare", href: "#compare" },
    { label: "Changelog", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Community", href: "#" },
    { label: "Support", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
];

export function Footer() {
  return (
    <footer className="relative pb-20 md:pb-0">
      {/* CTA Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090a] to-[#0a0b0d]">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] lg:w-[1000px] h-[250px] sm:h-[300px] lg:h-[400px] bg-cyan-500/10 rounded-full blur-[100px] sm:blur-[120px] lg:blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-100">
              Ready to study
              <span className="text-gradient"> smarter</span>?
            </h2>
            <p className="mt-4 sm:mt-5 lg:mt-6 text-sm sm:text-base lg:text-lg text-slate-400 max-w-xl mx-auto">
              Join thousands of learners who&apos;ve already made the switch.
              Start free—no credit card required.
            </p>
            <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                  iconPosition="right"
                  className="pulse-glow w-full sm:w-auto text-sm sm:text-base"
                >
                  Start Learning Free
                </Button>
              </Link>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                Schedule a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="relative bg-[#08090a] border-t border-[rgba(148,163,184,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-8">
            {/* Brand Column - Full width on mobile, then 2 cols */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2 mb-4 lg:mb-0">
              <a href="#" className="flex items-center gap-2 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] sm:shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#08090a]" />
                </div>
                <span className="font-display text-lg sm:text-xl font-bold text-slate-100">
                  Studek
                </span>
              </a>
              <p className="mt-3 sm:mt-4 text-slate-500 text-xs sm:text-sm max-w-xs">
                The next-generation spaced repetition platform. Master any subject
                with the power of AI.
              </p>

              {/* Social Links */}
              <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg bg-[#0f1115] border border-[rgba(148,163,184,0.08)] flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold text-sm sm:text-base text-slate-200 mb-3 sm:mb-4">{category}</h4>
                <ul className="space-y-2 sm:space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-slate-500 hover:text-slate-300 text-xs sm:text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 sm:mt-12 lg:mt-16 pt-6 sm:pt-8 border-t border-[rgba(148,163,184,0.08)] flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-xs sm:text-sm order-2 sm:order-1">
              © {new Date().getFullYear()} Studek. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm order-1 sm:order-2">
              <a href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
