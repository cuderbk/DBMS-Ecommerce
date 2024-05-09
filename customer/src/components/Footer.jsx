import React from 'react'
import {FaReact} from 'react-icons/fa'
import {BsFacebook,BsYoutube,BsDiscord} from 'react-icons/bs'
import {AiFillInstagram,AiFillTwitterCircle} from 'react-icons/ai'
export default function Footer() {
  return (
    <footer className='w-full bg-[#333]'>
      <div className='w-1/2 m-auto p-5 flex justify-center space-x-10 text-white'>
        <FaReact size={'2rem'}/>
        <BsDiscord size={'2rem'}/>
        <BsFacebook size={'2rem'}/>
        <BsYoutube size={'2rem'}/>
        <AiFillInstagram size={'2rem'}/>
        <AiFillTwitterCircle size={'2rem'}/>
      </div>
    </footer>
  )
}

