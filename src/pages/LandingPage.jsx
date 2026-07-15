import { useLayoutEffect, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { openDB } from 'idb'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import Marquee from '../components/landing/Marquee'
import HowItWorks from '../components/landing/HowItWorks'
import FeatureCards from '../components/landing/FeatureCards'
import Comparison from '../components/landing/Comparison'
import FAQ from '../components/landing/FAQ'
import BottomCTA from '../components/landing/BottomCTA'
import Footer from '../components/landing/Footer'

const DB_NAME = 'datasense-session-db';
const STORE_NAME = 'session-store';

export default function LandingPage() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Clear session automatically when user visits the homepage
  useEffect(() => {
    async function clearStoredSession() {
      try {
        const db = await openDB(DB_NAME, 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          }
        });
        await db.delete(STORE_NAME, 'current');
        console.log("Session cleared automatically on home page load.");
      } catch (err) {
        console.error("Failed to clear session on home page visit:", err);
      }
    }
    clearStoredSession();
  }, []);

  useLayoutEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        if (isFirstRender.current) {
          element.scrollIntoView({ behavior: 'auto' });
          isFirstRender.current = false;
        } else {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      isFirstRender.current = false;
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <Hero />
      <div className="relative overflow-hidden">
        <Marquee />
      </div>
      <HowItWorks />
      <FeatureCards />
      <Comparison />
      <FAQ />
      <BottomCTA />
      <Footer />
    </div>
  )
}
