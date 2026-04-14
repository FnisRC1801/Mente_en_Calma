"use client";

import styles from "./PublicHeder.module.css";

function PublicHeder() {
    return (
        <>
            <header className={styles.siteHeader}>
                <nav className={styles.nav}>
                    <a className={styles.brand} href="#inicio">
                        <img className={styles.logo} src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" alt="Mente en Calma" />
                        <span>Mente en Calma</span>
                    </a>
                    <div className={styles.navButtons}>
                        <a className={`${styles.navCta} ${styles.secondary}`} href="/singup">Regístrate</a>
                        <a className={styles.navCta} href="/login">¿Ya nos conoces? Inicia sesión</a>
                    </div>
                </nav>
            </header>

            <main id="inicio">
                <section className={styles.hero}>
                    <div className={styles.heroInner}>
                        <p className={styles.heroTagline}>Especialistas en mas de 15 areas de la Psicologia</p>
                        <h1>Tu bienestar comienza con un paso</h1>
                        <p className={styles.heroSub}>
                            Encuentra el equilibrio que mereces, ayudanos a ayudarte.
                        </p>
                        <a href="/singup" className={styles.heroCta}>ÚNETE AHORA</a>
                    </div>

                    <section id="proceso" className={`${styles.section} ${styles.process}`}>
                        <div className={styles.container}>
                            <h2>Conoce mas de nosotros</h2>
                            <div className={styles.steps}>
                                <div className={styles.step}>
                                    <div className={styles.stepBody}>
                                        <h3>+1000 Pacientes</h3>
                                        <p>Conformes y satisfechos, mostrando resultados favorecedores</p>
                                    </div>
                                </div>
                                <div className={styles.step}>
                                    <div className={styles.stepBody}>
                                        <h3>Horarios Flexibles</h3>
                                        <p>Agendas en horarios flexibles, para facilitar la experiencia del paciente</p>
                                    </div>
                                </div>
                                <div className={styles.step}>
                                    <div className={styles.stepBody}>
                                        <h3>Seguimiento constante</h3>
                                        <p>Cada paciente tiene su registro que puede consultar cada que desee</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </section>
            </main>
        </>
    );
}

export default PublicHeder;