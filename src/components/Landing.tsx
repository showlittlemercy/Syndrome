import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, Heart, Users } from 'lucide-react'

const LandingPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  }

  const floatVariants = {
    float: {
      y: [-20, 20, -20],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-syndrome-dark via-dark-900 to-dark-800 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-syndrome-primary opacity-10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-syndrome-secondary opacity-10 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-8 h-8 text-syndrome-primary" />
          <h1 className="text-2xl font-bold gradient-text">Syndrome</h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4"
        >
          <a href="/auth/signin" className="px-6 py-2 rounded-lg border border-syndrome-primary text-syndrome-primary hover:bg-syndrome-primary hover:text-white transition-colors">
            Sign In
          </a>
          <a href="/auth/signup" className="px-6 py-2 rounded-lg bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white font-semibold hover:shadow-glow-lg transition-shadow">
            Get Started
          </a>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center"
      >
        {/* Left side - Text */}
        <div>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-6xl font-black leading-tight mb-6"
          >
            Connect, Share &{' '}
            <span className="gradient-text">Communicate</span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-lg text-dark-300 mb-8 leading-relaxed"
          >
            Experience the next generation of social connection. Syndrome combines the best of Instagram and WhatsApp, bringing you a unified platform for sharing moments and meaningful conversations.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="space-y-4 mb-8"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-syndrome-primary" />
              <span>Real-time messaging with typing indicators</span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-syndrome-accent" />
              <span>Share and like posts from your favorite people</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-syndrome-primary" />
              <span>Create and manage group conversations</span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="/auth/signup"
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white font-semibold text-center hover:shadow-glow-lg transition-all transform hover:scale-105"
            >
              Start Free
            </a>
            <a
              href="#features"
              className="px-8 py-3 rounded-lg border border-dark-600 text-white font-semibold text-center hover:bg-dark-800 transition-colors"
            >
              Learn More
            </a>
          </motion.div>
        </div>

        {/* Right side - Illustration */}
        <motion.div
          variants={floatVariants}
          animate="float"
          className="relative hidden md:block"
        >
          <div className="relative w-full h-full">
            {/* Decorative circles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-2 border-syndrome-primary opacity-20 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-8 border-2 border-syndrome-secondary opacity-20 rounded-full"
            />

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-32 h-32 bg-gradient-to-br from-syndrome-primary to-syndrome-secondary rounded-full opacity-80 blur-2xl" />
              <Sparkles className="absolute w-20 h-20 text-syndrome-primary animate-pulse" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        id="features"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8"
      >
        {[
          {
            icon: <MessageCircle className="w-8 h-8" />,
            title: 'Instant Messaging',
            description: 'Chat one-on-one or in groups with real-time message delivery and read receipts.',
          },
          {
            icon: <Heart className="w-8 h-8" />,
            title: 'Social Feed',
            description: 'Share beautiful moments, like posts, and engage with your community through comments.',
          },
          {
            icon: <Users className="w-8 h-8" />,
            title: 'Community',
            description: 'Follow friends, build your network, and discover content from people you care about.',
          },
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            className="glass-effect p-8 rounded-xl border border-dark-700 hover:border-syndrome-primary transition-colors group"
          >
            <div className="text-syndrome-primary mb-4 group-hover:text-syndrome-accent transition-colors">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-dark-400">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center"
      >
        <h2 className="text-3xl font-bold mb-6">Ready to join Syndrome?</h2>
        <p className="text-dark-400 mb-8">Start connecting with people who matter, right now.</p>
        <a
          href="/auth/signup"
          className="inline-block px-8 py-4 rounded-lg bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white font-bold hover:shadow-glow-lg transition-all transform hover:scale-105"
        >
          Create Your Account
        </a>
      </motion.div>
    </div>
  )
}

export default LandingPage
