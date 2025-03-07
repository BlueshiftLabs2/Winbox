import React from 'react';
import Link from 'next/link';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import FeatureCard from '../components/landing/FeatureCard';
import PricingPreview from '../components/landing/PricingPreview';

const HomePage = () => {
  const features = [
    {
      title: 'High-Performance VPS',
      description: 'Powered by Intel Xeon Platinum CPUs and SSD storage',
      icon: 'server'
    },
    {
      title: 'Global Data Centers',
      description: '12 data centers across Europe, North America, Asia, and the Middle East',
      icon: 'globe'
    },
    {
      title: '24/7 Support',
      description: 'Dedicated technical support and server monitoring',
      icon: 'headset'
    },
    {
      title: '5000GB/Month Traffic',
      description: 'Generous bandwidth allocation included with each server',
      icon: 'network'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      