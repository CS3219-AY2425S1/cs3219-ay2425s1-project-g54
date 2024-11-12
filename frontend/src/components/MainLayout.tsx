import NavBar from './NavBar/navbar'
import { ReactJSXElement } from '@emotion/react/types/jsx-namespace'

export default function MainLayout({ children }: { children: ReactJSXElement }) {
    return (
        <section className='min-h-screen flex flex-col'>
            <NavBar />
            <section className='flex flex-1 min-h-full justify-center'>
                {children}
            </section>
        </section>

    )
}
