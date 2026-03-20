import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import { Button } from '@/components/elements/button/index';
import Reaptcha from 'reaptcha';
import Turnstile from '@/components/elements/Turnstile';
import useFlash from '@/plugins/useFlash';
import Label from '@/components/elements/Label';
import { KeyIcon, UserIcon, EyeIcon, EyeOffIcon } from '@heroicons/react/solid';
import { useTranslation } from 'react-i18next';

interface Values {
    username: string;
    password: string;
}

const CyberClock = () => {
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 8));
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date().toTimeString().slice(0, 8)), 1000);
        return () => clearInterval(interval);
    }, []);
    return <span>{time}</span>;
};

const ParticleField = () => {
    const particles = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: Math.random() * 20 + 12,
        delay: Math.random() * 20,
        dx: (Math.random() - 0.5) * 150,
        size: Math.random() * 2 + 1,
    }));
    return (
        <>
            {particles.map(p => (
                <div
                    key={p.id}
                    className="kd-particle"
                    style={{
                        left: `${p.left}vw`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `-${p.delay}s`,
                        ['--dx' as any]: `${p.dx}px`,
                    }}
                />
            ))}
        </>
    );
};

const LoginContainer = ({ history }: RouteComponentProps) => {
    const { t } = useTranslation('auth');
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');
    const [show, setShow] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { provider, recaptcha, turnstile } = useStoreState((state) => state.settings.data!.captcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        if (provider === 'recaptcha' && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
            return;
        }
        if (provider === 'turnstile' && !token) {
            setSubmitting(false);
            return;
        }
        login({ ...values, captchaToken: token, captchaProvider: provider })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }
                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);
                setToken('');
                if (ref.current) ref.current.reset();
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                body {
                    background: #080808 !important;
                    font-family: 'DM Sans', sans-serif !important;
                    min-height: 100vh;
                }

                body::after {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%);
                    pointer-events: none;
                    z-index: 0;
                }

                .kd-orb {
                    position: fixed;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 0;
                    animation: orbFloat ease-in-out infinite alternate;
                }
                .kd-orb-1 {
                    width: 600px; height: 600px;
                    background: radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%);
                    top: -200px; left: -200px;
                    animation-duration: 12s;
                }
                .kd-orb-2 {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(180,180,180,0.03) 0%, transparent 70%);
                    bottom: -100px; right: -100px;
                    animation-duration: 9s;
                    animation-delay: -4s;
                }
                @keyframes orbFloat {
                    from { transform: scale(1) translate(0,0); }
                    to   { transform: scale(1.15) translate(20px,-20px); }
                }

                .kd-particle {
                    position: fixed;
                    background: rgba(255,255,255,0.35);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 0;
                    animation: particleRise linear infinite;
                    opacity: 0;
                }
                @keyframes particleRise {
                    0%   { transform: translateY(100vh) translateX(0); opacity: 0; }
                    10%  { opacity: 0.5; }
                    90%  { opacity: 0.5; }
                    100% { transform: translateY(-100px) translateX(var(--dx)); opacity: 0; }
                }

                .kd-card {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 400px;
                    padding: 40px 36px 36px;
                    background: rgba(12, 12, 12, 0.94);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 20px;
                    backdrop-filter: blur(32px);
                    box-shadow:
                        0 0 0 1px rgba(255,255,255,0.03),
                        0 40px 100px rgba(0,0,0,0.8),
                        inset 0 1px 0 rgba(255,255,255,0.06);
                    animation: cardReveal 0.9s cubic-bezier(0.16,1,0.3,1) both;
                }
                @keyframes cardReveal {
                    from { opacity:0; transform:translateY(40px) scale(0.96); }
                    to   { opacity:1; transform:translateY(0) scale(1); }
                }
                .kd-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 20%; right: 20%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
                }

                .kd-logo-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 28px;
                }
                .kd-logo-img-wrap {
                    position: relative;
                    width: 90px; height: 90px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .kd-ring {
                    position: absolute;
                    inset: -8px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.08);
                    animation: spin 9s linear infinite;
                }
                .kd-ring::after {
                    content: '';
                    position: absolute;
                    top: -3px; left: 50%;
                    width: 5px; height: 5px;
                    background: rgba(255,255,255,0.6);
                    border-radius: 50%;
                    transform: translateX(-50%);
                    box-shadow: 0 0 8px rgba(255,255,255,0.6);
                }
                .kd-ring-2 {
                    position: absolute;
                    inset: -18px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.03);
                    animation: spin 16s linear infinite reverse;
                }
                @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

                .kd-logo-img {
                    width: 90px; height: 90px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(255,255,255,0.1);
                    box-shadow: 0 0 40px rgba(255,255,255,0.07), 0 10px 40px rgba(0,0,0,0.6);
                    opacity: 0;
                    transition: opacity 0.7s ease;
                    position: relative;
                    z-index: 1;
                    animation: logoPulse 4s ease-in-out infinite alternate;
                }
                .kd-logo-img.loaded { opacity: 1; }
                @keyframes logoPulse {
                    from { box-shadow: 0 0 30px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.6); }
                    to   { box-shadow: 0 0 50px rgba(255,255,255,0.12), 0 10px 40px rgba(0,0,0,0.6); }
                }

                .kd-logo-glow {
                    position: absolute;
                    bottom: -8px; left: 50%;
                    transform: translateX(-50%);
                    width: 70px; height: 20px;
                    background: rgba(255,255,255,0.07);
                    filter: blur(12px);
                    border-radius: 50%;
                }

                .kd-name {
                    font-family: 'Syne', sans-serif;
                    font-size: 20px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    color: #ffffff;
                    margin-bottom: 4px;
                    text-align: center;
                }
                .kd-sub {
                    font-size: 10px;
                    letter-spacing: 3px;
                    color: rgba(255,255,255,0.22);
                    text-transform: uppercase;
                    text-align: center;
                }

                .kd-divider {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0 0 24px;
                }
                .kd-divider-line { flex:1; height:1px; background: rgba(255,255,255,0.06); }
                .kd-divider-dot { width:3px; height:3px; background:rgba(255,255,255,0.18); border-radius:50%; }

                .kd-card input[type=text],
                .kd-card input[type=email],
                .kd-card input[type=password] {
                    background: rgba(255,255,255,0.04) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    border-radius: 10px !important;
                    color: #e8e8e8 !important;
                    font-family: 'DM Sans', sans-serif !important;
                    font-size: 14px !important;
                    transition: all 0.25s !important;
                }
                .kd-card input:focus {
                    border-color: rgba(255,255,255,0.2) !important;
                    background: rgba(255,255,255,0.06) !important;
                    box-shadow: 0 0 0 3px rgba(255,255,255,0.04) !important;
                    outline: none !important;
                }
                .kd-card input::placeholder { color: rgba(255,255,255,0.18) !important; }
                .kd-card label {
                    color: rgba(255,255,255,0.3) !important;
                    font-size: 11px !important;
                    letter-spacing: 1.5px !important;
                    text-transform: uppercase !important;
                    font-family: 'DM Sans', sans-serif !important;
                    font-weight: 500 !important;
                }
                .kd-card button[type=submit] {
                    background: rgba(255,255,255,0.92) !important;
                    border: none !important;
                    border-radius: 10px !important;
                    color: #0a0a0a !important;
                    font-family: 'Syne', sans-serif !important;
                    font-weight: 700 !important;
                    font-size: 13px !important;
                    letter-spacing: 2px !important;
                    text-transform: uppercase !important;
                    transition: all 0.25s !important;
                    box-shadow: 0 4px 20px rgba(255,255,255,0.08) !important;
                }
                .kd-card button[type=submit]:hover {
                    background: #ffffff !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 8px 30px rgba(255,255,255,0.15) !important;
                }
                .kd-card button[type=submit]:disabled { opacity: 0.4 !important; transform: none !important; }
                .kd-card a {
                    color: rgba(255,255,255,0.28) !important;
                    font-size: 12px !important;
                    text-decoration: none !important;
                    transition: color 0.2s !important;
                }
                .kd-card a:hover { color: rgba(255,255,255,0.65) !important; }

                .kd-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    margin-top: 22px;
                    padding-top: 18px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .kd-dot {
                    width: 6px; height: 6px;
                    background: #4ade80;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #4ade80;
                    animation: dotBlink 2.5s ease-in-out infinite;
                }
                @keyframes dotBlink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
                .kd-status-text {
                    font-size: 10px;
                    letter-spacing: 2px;
                    color: rgba(255,255,255,0.18);
                    text-transform: uppercase;
                }

                .kd-hud {
                    position: fixed;
                    font-family: 'DM Sans', monospace;
                    font-size: 9px;
                    letter-spacing: 1.5px;
                    color: rgba(255,255,255,0.1);
                    pointer-events: none;
                    z-index: 5;
                    text-transform: uppercase;
                }
            `}</style>

            <div className="kd-orb kd-orb-1" />
            <div className="kd-orb kd-orb-2" />
            <ParticleField />

            <div className="kd-hud" style={{ top: 16, left: 16 }}>Kang Daffa Panel<br /><CyberClock /></div>
            <div className="kd-hud" style={{ bottom: 16, right: 16, textAlign: 'right' }}>Auth v2.0<br />Online</div>

            <div className="kd-card">
                <div className="kd-logo-wrap">
                    <div className="kd-logo-img-wrap">
                        <div className="kd-ring-2" />
                        <div className="kd-ring" />
                        <img
                            src="https://files.catbox.moe/7fwwwe.png"
                            className={`kd-logo-img${imgLoaded ? ' loaded' : ''}`}
                            onLoad={() => setImgLoaded(true)}
                            alt="Kang Daffa"
                        />
                        <div className="kd-logo-glow" />
                    </div>
                    <div className="kd-name">Kang Daffa Panel</div>
                    <div className="kd-sub">Game Server Control</div>
                </div>

                <div className="kd-divider">
                    <div className="kd-divider-line" />
                    <div className="kd-divider-dot" />
                    <div className="kd-divider-line" />
                </div>

                <Formik
                    onSubmit={onSubmit}
                    initialValues={{ username: '', password: '' }}
                    validationSchema={object().shape({
                        username: string().required(t('username-required')),
                        password: string().required(t('password-required')),
                    })}
                >
                    {({ isSubmitting, setSubmitting, submitForm }) => (
                        <LoginFormContainer title={''} css={undefined}>
                            <Field
                                icon={UserIcon}
                                type={'text'}
                                placeholder={t('username-label')}
                                label={t('username-label')}
                                name={'username'}
                                disabled={isSubmitting}
                            />
                            <div style={{ marginTop: 14 }}>
                                <Label>{t('password-label')}</Label>
                                <div style={{ position: 'relative' }}>
                                    <Field
                                        icon={KeyIcon}
                                        type={show ? 'text' : 'password'}
                                        placeholder={t('password-label')}
                                        name={'password'}
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type={'button'}
                                        style={{ position:'absolute', top:10, right:8, padding:'4px', background:'transparent', border:'none', color:'rgba(255,255,255,0.25)', cursor:'pointer' }}
                                        onClick={() => setShow(!show)}
                                    >
                                        {show ? <EyeOffIcon className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: 22 }}>
                                <Button style={{ width:'100%', padding:'13px' }} type={'submit'} disabled={isSubmitting}>
                                    {isSubmitting ? 'Authenticating...' : t('login-button')}
                                </Button>
                            </div>

                            {provider === 'recaptcha' && (
                                <Reaptcha
                                    ref={ref}
                                    size={'invisible'}
                                    sitekey={recaptcha.siteKey || '_invalid_key'}
                                    onVerify={(response) => { setToken(response); submitForm(); }}
                                    onExpire={() => { setSubmitting(false); setToken(''); }}
                                />
                            )}
                            {provider === 'turnstile' && (
                                <div style={{ marginTop:14, display:'flex', justifyContent:'center' }}>
                                    <Turnstile
                                        siteKey={turnstile.siteKey}
                                        onVerify={(response) => setToken(response)}
                                        onExpire={() => setToken('')}
                                    />
                                </div>
                            )}

                            <div style={{ marginTop:14, textAlign:'center' }}>
                                <Link to={'/auth/password'}>{t('forgot-password.label')}</Link>
                            </div>
                        </LoginFormContainer>
                    )}
                </Formik>

                <div className="kd-status">
                    <div className="kd-dot" />
                    <div className="kd-status-text">All Systems Online</div>
                </div>
            </div>
        </>
    );
};

export default LoginContainer;
