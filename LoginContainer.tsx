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

const LoginContainer = ({ history }: RouteComponentProps) => {
    const { t } = useTranslation('auth');
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');
    const [show, setShow] = useState(false);
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
            {/* Inject global styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap');

                body {
                    background: #010208 !important;
                    font-family: 'Rajdhani', sans-serif !important;
                }

                .cyber-bg-grid {
                    position: fixed;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px);
                    background-size: 50px 50px;
                    animation: gridShift 20s linear infinite;
                    z-index: 0;
                    pointer-events: none;
                }
                @keyframes gridShift { from { transform: translate(0,0); } to { transform: translate(50px,50px); } }

                .cyber-blob {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                    pointer-events: none;
                }
                .cyber-blob-1 { width:500px; height:500px; background: radial-gradient(circle, rgba(0,128,255,0.18), transparent 70%); top:-150px; left:-150px; }
                .cyber-blob-2 { width:400px; height:400px; background: radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%); bottom:-100px; right:-100px; }

                .cyber-scanlines {
                    position: fixed;
                    inset: 0;
                    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px);
                    pointer-events: none;
                    z-index: 1;
                }

                .cyber-hud {
                    position: fixed;
                    z-index: 8;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 9px;
                    letter-spacing: 2px;
                    color: rgba(0,245,255,0.2);
                    pointer-events: none;
                }

                .cyber-card {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 420px;
                    padding: 44px 40px;
                    background: rgba(5,15,40,0.85);
                    border: 1px solid rgba(0,245,255,0.15);
                    border-radius: 16px;
                    backdrop-filter: blur(24px);
                    box-shadow: 0 0 0 1px rgba(0,245,255,0.06), 0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05);
                    animation: cardIn 0.8s cubic-bezier(0.22,1,0.36,1) both;
                }
                @keyframes cardIn { from { opacity:0; transform:translateY(30px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }

                .cyber-card::before, .cyber-card::after {
                    content: '';
                    position: absolute;
                    width: 18px; height: 18px;
                    border-color: #00f5ff;
                    border-style: solid;
                    opacity: 0.5;
                }
                .cyber-card::before { top:-1px; left:-1px; border-width:2px 0 0 2px; border-radius:16px 0 0 0; }
                .cyber-card::after  { bottom:-1px; right:-1px; border-width:0 2px 2px 0; border-radius:0 0 16px 0; }

                .cyber-logo-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 64px; height: 64px;
                    background: linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,128,255,0.15));
                    border: 1px solid rgba(0,245,255,0.3);
                    border-radius: 16px;
                    margin-bottom: 14px;
                    box-shadow: 0 0 24px rgba(0,245,255,0.15);
                }

                .cyber-title {
                    font-family: 'Orbitron', sans-serif !important;
                    font-size: 22px !important;
                    font-weight: 900 !important;
                    letter-spacing: 3px !important;
                    text-transform: uppercase !important;
                    background: linear-gradient(90deg, #00f5ff, #0080ff) !important;
                    -webkit-background-clip: text !important;
                    -webkit-text-fill-color: transparent !important;
                    background-clip: text !important;
                    line-height: 1 !important;
                    margin-bottom: 4px !important;
                }

                .cyber-sub {
                    font-size: 11px;
                    letter-spacing: 4px;
                    color: rgba(0,245,255,0.4);
                    text-transform: uppercase;
                }

                .cyber-divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 24px 0;
                }
                .cyber-divider-line { flex:1; height:1px; background: rgba(0,245,255,0.15); }
                .cyber-divider-text { font-size:10px; letter-spacing:3px; color:rgba(0,245,255,0.3); text-transform:uppercase; }

                .cyber-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 24px;
                }
                .cyber-dot {
                    width: 7px; height: 7px;
                    background: #00ff88;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #00ff88;
                    animation: blink 2s ease-in-out infinite;
                }
                @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
                .cyber-status-text { font-size:11px; letter-spacing:2px; color:rgba(0,255,136,0.6); text-transform:uppercase; }

                /* Override field/button styles */
                .cyber-card input {
                    background: rgba(0,245,255,0.04) !important;
                    border-color: rgba(0,245,255,0.15) !important;
                    color: #e0f7ff !important;
                    font-family: 'Rajdhani', sans-serif !important;
                }
                .cyber-card input:focus {
                    border-color: rgba(0,245,255,0.5) !important;
                    box-shadow: 0 0 0 3px rgba(0,245,255,0.08) !important;
                    background: rgba(0,245,255,0.07) !important;
                }
                .cyber-card label {
                    color: rgba(0,245,255,0.5) !important;
                    font-size: 11px !important;
                    letter-spacing: 2px !important;
                    text-transform: uppercase !important;
                    font-family: 'Rajdhani', sans-serif !important;
                }
                .cyber-card button[type=submit] {
                    background: linear-gradient(135deg, rgba(0,128,255,0.8), rgba(0,245,255,0.6)) !important;
                    border: 1px solid rgba(0,245,255,0.4) !important;
                    font-family: 'Orbitron', sans-serif !important;
                    letter-spacing: 3px !important;
                    text-transform: uppercase !important;
                    font-size: 13px !important;
                    box-shadow: 0 4px 20px rgba(0,128,255,0.3) !important;
                    transition: all 0.3s !important;
                }
                .cyber-card button[type=submit]:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 30px rgba(0,128,255,0.5) !important;
                }
                .cyber-card a {
                    color: rgba(0,245,255,0.4) !important;
                    font-size: 12px !important;
                    letter-spacing: 1px !important;
                }
                .cyber-card a:hover {
                    color: #00f5ff !important;
                }
            `}</style>

            {/* Background effects */}
            <div className="cyber-bg-grid" />
            <div className="cyber-blob cyber-blob-1" />
            <div className="cyber-blob cyber-blob-2" />
            <div className="cyber-scanlines" />

            {/* HUD corners */}
            <div className="cyber-hud" style={{ top: 20, left: 20 }}>
                SYS://PTERODACTYL<br />
                <CyberClock />
            </div>
            <div className="cyber-hud" style={{ bottom: 20, right: 20, textAlign: 'right' }}>
                BUILD v1.11.9<br />AUTH MODULE
            </div>

            {/* Card */}
            <div className="cyber-card">
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div className="cyber-logo-icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="#00f5ff" style={{ filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.7))' }}>
                            <path d="M16 3 C10 3, 4 8, 3 14 L8 12 C9 9, 12 7, 16 7 C20 7, 23 9, 24 12 L29 14 C28 8, 22 3, 16 3 Z"/>
                            <path d="M3 14 L8 12 L10 20 L16 29 L22 20 L24 12 L29 14 L24 22 C22 26, 19 29, 16 29 C13 29, 10 26, 8 22 Z"/>
                            <circle cx="16" cy="11" r="2"/>
                        </svg>
                    </div>
                    <div className="cyber-title">Pterodactyl</div>
                    <div className="cyber-sub">Game Panel</div>
                </div>

                <div className="cyber-divider">
                    <div className="cyber-divider-line" />
                    <div className="cyber-divider-text">Authenticate</div>
                    <div className="cyber-divider-line" />
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
                            <div style={{ marginTop: 12 }}>
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
                                        style={{ position: 'absolute', top: 10, right: 6, padding: '4px', background: 'transparent', border: 'none', color: 'rgba(0,245,255,0.4)', cursor: 'pointer' }}
                                        onClick={() => setShow(!show)}
                                    >
                                        {show ? <EyeOffIcon className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <Button style={{ width: '100%', padding: '14px' }} type={'submit'} disabled={isSubmitting}>
                                    {t('login-button')}
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
                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                                    <Turnstile
                                        siteKey={turnstile.siteKey}
                                        onVerify={(response) => setToken(response)}
                                        onExpire={() => setToken('')}
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: 12, textAlign: 'center' }}>
                                <Link to={'/auth/password'}>
                                    {t('forgot-password.label')}
                                </Link>
                            </div>
                        </LoginFormContainer>
                    )}
                </Formik>

                <div className="cyber-status">
                    <div className="cyber-dot" />
                    <div className="cyber-status-text">Server Online</div>
                </div>
            </div>
        </>
    );
};

// Live clock component
const CyberClock = () => {
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 8));
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date().toTimeString().slice(0, 8)), 1000);
        return () => clearInterval(interval);
    }, []);
    return <span>{time}</span>;
};

export default LoginContainer;
