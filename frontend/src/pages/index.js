import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import Minter from '@/components/Minter'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <>
      <Head>
        <title>Dynamic Weather Card</title>
        <meta name="description" content="A dynamic NFT that changes with your city's air pollution" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.description}>
          <p>
            Get your dynamic NFT that changes with&nbsp;
            <code className={styles.code}>your city's Air Pollution</code>
          </p>
        </div>
        <div className={styles.center}>
          <Minter></Minter>
        </div>
      </main>
    </>
  )
}
