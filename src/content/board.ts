import grahamImg from '../assets/board/graham-fawson.jpg'
import blaneImg from '../assets/board/blane-santilli.jpg'
import devinImg from '../assets/board/devin-holderness.jpg'
import joshImg from '../assets/board/joshua-schmitt.jpg'

export const BOARD = [
  {
    name: 'Graham Fawson',
    role: 'Board Member',
    href: '/board/graham-fawson',
    img: grahamImg,
  },
  {
    name: 'Blane Santilli',
    role: 'Board Member',
    href: '/board/blane-santilli',
    img: blaneImg,
  },
  {
    name: 'Devin Holderness',
    role: 'Board Member',
    href: '/board/devin-holderness',
    img: devinImg,
  },
  {
    name: 'Joshua Schmitt',
    role: 'Board Member',
    href: '/board/joshua-schmitt',
    img: joshImg,
  },
] as const
