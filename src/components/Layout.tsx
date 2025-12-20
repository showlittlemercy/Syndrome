import React from 'react'
import BottomNavigation from './BottomNavigation'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-900">
      <div className="pb-24">
        {children}
      </div>
      <BottomNavigation />
    </div>
  )
}

export default Layout
