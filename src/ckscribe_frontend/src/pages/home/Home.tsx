// Date: 11/11/2024 @iamenochchirima

import Navbar from './Navbar'
import Hero from './Hero'
import Footer from './Footer'

const Home = () => {
  return (
    <div className='bg-gradient-to-b from-gray-950 to-blue-950  text-white pt-5 sm:px-20 px-5 grid min-h-[100vh] grid-rows-[auto_1fr_auto]'>
        <Navbar />
        <Hero />
        <Footer />
    </div>
  )
}

export default Home