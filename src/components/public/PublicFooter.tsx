import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const socialLinks = [
  { icon: Linkedin, href: '/under-construction', label: 'LinkedIn' },
  { icon: Facebook, href: '/under-construction', label: 'Facebook' },
  { icon: Twitter, href: '/under-construction', label: 'X (Twitter)' },
  { icon: Instagram, href: '/under-construction', label: 'Instagram' },
  { icon: Youtube, href: '/under-construction', label: 'YouTube' },
];

const aboutLinks = [
  { label: 'Mission and Vision', href: '/about' },
  { label: 'Strategy Document', href: '/about' },
  { label: 'Handbook', href: '/resources' },
  { label: 'Legacy Gallery', href: '/about' },
  { label: 'Academic Calendar', href: '/resources/academic-calendar' },
];

const quickLinks = [
  { label: 'PEPSA', href: '/under-construction' },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Alumni', href: '/under-construction' },
  { label: 'Resources', href: '/resources' },
];

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative text-brand-white text-center md:text-left  mt-4">
      <div className="absolute bg-brand-navy h-10 -top-10 right-0 left-0" />
      <div className="absolute inset-0 -z-20">
        <Image
          src="/assets/whitehouse-footer.png"
          alt=""
          fill
          className="object-cover object-[20%_0%]  md:object-center"
        />
      </div>
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/75 to-black/50"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10 pt-20 md:pt-40 lg:pt-60 pb-12">
        <div className="flex flex-col md:flex-row gap-10 lg:gap-8 ">
          {/* ── Left block: logo + social + CTA ── */}
          <div className="flex flex-col gap-6 items-center md:items-start md:w-2/5">
            <Image
              src="/assets/logoSecondary.svg"
              alt="Department of Physics and Engineering Physics"
              width={360}
              height={64}
              className="h-10 sm:h-12 w-auto"
            />

            {/* Social icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>

            <Link
              href="/under-construction"
              className="inline-block bg-brand-yellow text-brand-ink text-base font-semibold px-6 py-2.5 hover:bg-yellow-500 transition-colors w-fit"
            >
              GIVE TO PHYSICS
            </Link>
          </div>

          {/* ── Contact column ── */}
          <div className="md:w-1/5">
            <h3 className="font-serif font-semibold text-base text-brand-yellow mb-4">Contact</h3>
            <address className="not-italic text-base text-white/80 space-y-1.5">
              <p>Faculty of Science</p>
              <p>University Road 2</p>
              <p>Whitehouse Building</p>
              <p>220282 Ile-Ife, Nigeria</p>
              <p className="pt-2">
                <Link
                  href="mailto:peph@oauife.edu.ng"
                  className="hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  peph@oauife.edu.ng
                </Link>
              </p>
              <p>
                <Link
                  href="tel:+2349036368824"
                  className="hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  +234 903 636 8824
                </Link>
              </p>
            </address>
          </div>

          {/* ── About Us column ── */}
          <div className="md:w-1/5">
            <h3 className="font-serif font-semibold text-base text-brand-yellow mb-4">About Us</h3>
            <ul className="space-y-2.5">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-base text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Quick Links column ── */}
          <div className="md:w-1/5">
            <h3 className="font-serif font-semibold text-base text-brand-yellow mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-base text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom divider + copyright ── */}
        <div className="border-t border-white/20 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-base text-white/75">
          <p className="text-balance">
            &copy; {currentYear} Department of Physics and Engineering Physics. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/under-construction"
              className="hover:text-white hover:underline underline-offset-4 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-white/50">/</span>
            <Link
              href="/under-construction"
              className="hover:text-white hover:underline underline-offset-4 transition-colors"
            >
              Terms of Use
            </Link>
            <span className="text-white/50">/</span>
            <Link
              href="/under-construction"
              className="hover:text-white hover:underline underline-offset-4 transition-colors"
            >
              Accessibility Statement
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
