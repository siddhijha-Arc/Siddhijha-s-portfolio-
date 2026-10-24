import React, { useState, useRef, useEffect } from 'react';

export default function App() {
  const [isIronManVisible, setIsIronManVisible] = useState(true);
  const [isSpiderManVisible, setIsSpiderManVisible] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [tapeBounce, setTapeBounce] = useState(false);
  const [lanyardSwing, setLanyardSwing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [charactersDeployed, setCharactersDeployed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gwenSwing, setGwenSwing] = useState(false);
  const [spideySwing, setSpideySwing] = useState(false);
  const [milesSwing, setMilesSwing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  });

  const [batteryLevel, setBatteryLevel] = useState<number>(94);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [scratches, setScratches] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);
  const [tiltX, setTiltX] = useState<number>(0);
  const [tiltY, setTiltY] = useState<number>(0);
  const [socialModal, setSocialModal] = useState<{ platform: string; url: string } | null>(null);
  const [portraitIndex, setPortraitIndex] = useState<number>(0);
  const scratchThrottleRef = useRef(0);

  const portraitImages = [
    '/assets/aistudio/1000008345_12a38a82.png',
    '/assets/aistudio/file_0000000061788211bbaece728e38b584_b2cfbd73.png',
  ];

  const handlePortraitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('contact');
    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch {}
    }
    setPortraitIndex((prev) => (prev + 1) % portraitImages.length);
  };

  const buttonTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const openSocialLink = (platform: string, url: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    playSound('contact');
    if (navigator.vibrate) { try { navigator.vibrate(35); } catch {} }
    setSocialModal({ platform, url });
  };

  const handleSocialButtonClick = (platform: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;

    if (buttonTouchStartRef.current) {
      const dx = Math.abs(e.clientX - buttonTouchStartRef.current.x);
      const dy = Math.abs(e.clientY - buttonTouchStartRef.current.y);
      buttonTouchStartRef.current = null;
      if (dx > 12 || dy > 12) {
        return; // Finger moved during swipe gesture, ignore popup
      }
    }
    openSocialLink(platform, url, e);
  };

  useEffect(() => {
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma || 0; // Left/right tilt
      const beta = event.beta || 0;   // Forward/back tilt
      
      const clampedX = Math.max(-20, Math.min(20, gamma));
      const clampedY = Math.max(-20, Math.min(20, beta - 45));
      
      setTiltX(clampedX * 0.35);
      setTiltY(clampedY * 0.35);
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation);

    const requestOrientationPermission = async () => {
      try {
        const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
        if (DOE && typeof DOE.requestPermission === 'function') {
          const response = await DOE.requestPermission();
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        }
      } catch {
        // Ignored
      }
      window.removeEventListener('click', requestOrientationPermission);
    };
    window.addEventListener('click', requestOrientationPermission, { once: true });

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('click', requestOrientationPermission);
    };
  }, []);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = Date.now();
    if (now - scratchThrottleRef.current < 50) return;
    scratchThrottleRef.current = now;

    const angle = (Math.random() - 0.5) * 60;
    const newScratch = { id: Math.random(), x, y, angle };

    setScratches((prev) => [...prev.slice(-10), newScratch]);
  };

  useEffect(() => {
    const scratchFadeInterval = setInterval(() => {
      setScratches((prev) => prev.slice(1));
    }, 150);
    return () => clearInterval(scratchFadeInterval);
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const navWithBattery = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, listener: () => void) => void;
      }>;
    };

    if (navWithBattery.getBattery) {
      navWithBattery.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {});
    }
  }, []);

  const ironManTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spiderManTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);
  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const lastShakeTime = useRef(0);

  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (magnitude > 16.5 && now - lastShakeTime.current > 1200) {
        lastShakeTime.current = now;
        setIsShaking(true);
        playSound('tape');
        setTimeout(() => setIsShaking(false), 550);
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);

    // Request permission for iOS 13+ devices on first user interaction
    const requestMotionPermission = async () => {
      try {
        const DM = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
        if (DM && typeof DM.requestPermission === 'function') {
          const response = await DM.requestPermission();
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
          }
        }
      } catch {
        // Ignored if not supported or denied
      }
      window.removeEventListener('click', requestMotionPermission);
    };
    window.addEventListener('click', requestMotionPermission, { once: true });

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      window.removeEventListener('click', requestMotionPermission);
      if (ironManTimerRef.current) clearTimeout(ironManTimerRef.current);
      if (spiderManTimerRef.current) clearTimeout(spiderManTimerRef.current);
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      if (transitionEndTimeoutRef.current) clearTimeout(transitionEndTimeoutRef.current);
    };
  }, []);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthBusyUntilRef = useRef<number>(0);

  const isAudioPlaying = () => {
    if (activeAudioRef.current && !activeAudioRef.current.paused) {
      return true;
    }
    if (Date.now() < synthBusyUntilRef.current) {
      return true;
    }
    return false;
  };

  const playMediaAudio = (src: string, volume = 0.85, durationMs?: number) => {
    if (isAudioPlaying()) return false;
    
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      activeAudioRef.current = audio;
      audio.play().catch(() => {});
      
      const clearActive = () => {
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
        }
      };
      
      audio.onended = clearActive;
      audio.onerror = clearActive;

      if (durationMs) {
        setTimeout(() => {
          if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
          clearActive();
        }, durationMs);
      }
      return true;
    } catch {
      return false;
    }
  };

  // Web Audio API Synthesizer (Instant, 100% reliable, zero network dependency)
  const playSound = (type: 'spiderman' | 'ironman' | 'zip' | 'barcode' | 'contact' | 'clasp' | 'tape' | 'respawn' | 'flip') => {
    if (isAudioPlaying()) return;

    if (type === 'ironman') {
      const played = playMediaAudio('/assets/audio/ironman_suitup.mp3', 0.85);
      if (played) {
        synthBusyUntilRef.current = Date.now() + 1500;
      }
      return;
    }

    if (type === 'spiderman') {
      playMediaAudio('/assets/audio/spiderman_desi_8s.mp3', 0.9, 8000);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'zip') {
        synthBusyUntilRef.current = Date.now() + 380;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'barcode') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1760, ctx.currentTime);
        osc2.frequency.setValueAtTime(2637, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc1.stop(ctx.currentTime + 0.08);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.28);
      } else if (type === 'contact') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.035);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.035);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4 + idx * 0.035);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.035);
          osc.stop(ctx.currentTime + 0.5 + idx * 0.035);
        });
      } else if (type === 'clasp') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } else if (type === 'tape') {
        const bufferSize = Math.floor(ctx.sampleRate * 0.12);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, ctx.currentTime);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } else if (type === 'respawn') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.42);
      } else if (type === 'flip') {
        // Crisp card swoosh / flip sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.28);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.32);
      }
    } catch {
      // Audio fallback silent
    }
  };

  const handleCardFlip = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);

    if (!isFlipped) {
      // FRONT TO BACK:
      // 1. Initiate 3D card rotation immediately
      playSound('flip');
      setIsFlipped(true);

      // 2. As the back face reveals (300ms), characters drop down from inside the black pill bar
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(() => {
        playSound('zip');
        setCharactersDeployed(true);

        if (transitionEndTimeoutRef.current) clearTimeout(transitionEndTimeoutRef.current);
        transitionEndTimeoutRef.current = setTimeout(() => {
          isTransitioningRef.current = false;
          setIsTransitioning(false);
        }, 600);
      }, 300);
    } else {
      // BACK TO FRONT:
      // "aur jbb firse front janey wala ho card pehly teeno character uss black bar mai disappear ho jaye then front khuley"
      // 1. FIRST: Retract characters straight up into the black bar with web zip sound
      playSound('zip');
      setCharactersDeployed(false);

      // 2. AFTER characters have vanished into the black bar (360ms), flip the card back to front
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(() => {
        playSound('flip');
        setIsFlipped(false);

        if (transitionEndTimeoutRef.current) clearTimeout(transitionEndTimeoutRef.current);
        transitionEndTimeoutRef.current = setTimeout(() => {
          isTransitioningRef.current = false;
          setIsTransitioning(false);
        }, 650);
      }, 360);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect left/right swipe with a minimum horizontal threshold
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
      handleCardFlip();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current !== null) {
      const deltaX = e.clientX - mouseStartX.current;
      if (Math.abs(deltaX) > 45) {
        handleCardFlip();
      }
      mouseStartX.current = null;
    }
  };

  const handleIronManClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('ironman');
    if (navigator.vibrate) {
      try { navigator.vibrate([40, 50, 40]); } catch {}
    }
    setIsIronManVisible(false);

    if (ironManTimerRef.current) clearTimeout(ironManTimerRef.current);
    ironManTimerRef.current = setTimeout(() => {
      playSound('respawn');
      if (navigator.vibrate) {
        try { navigator.vibrate(30); } catch {}
      }
      setIsIronManVisible(true);
    }, 5000);
  };

  const handleSpiderManClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('spiderman');
    if (navigator.vibrate) {
      try { navigator.vibrate([30, 40, 30]); } catch {}
    }
    setIsSpiderManVisible(false);

    if (spiderManTimerRef.current) clearTimeout(spiderManTimerRef.current);
    spiderManTimerRef.current = setTimeout(() => {
      playSound('respawn');
      if (navigator.vibrate) {
        try { navigator.vibrate(30); } catch {}
      }
      setIsSpiderManVisible(true);
    }, 5000);
  };

  const handleBarcodeCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('barcode');
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 800);
  };

  const handleContactCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('contact');
    navigator.clipboard?.writeText('Phone: 8289640516 | Email: siddhikumarjha356@gmail.com');
    setCopiedContact(true);
    setTimeout(() => setCopiedContact(false), 1500);
  };

  const handleTapeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('tape');
    setTapeBounce(true);
    setTimeout(() => setTapeBounce(false), 450);
  };

  const handleLanyardClick = () => {
    playSound('clasp');
    setLanyardSwing(true);
    setTimeout(() => setLanyardSwing(false), 850);
  };

  return (
    <div className="bg-dark-textured min-h-screen flex flex-col items-center justify-start py-0 px-3 overflow-x-hidden antialiased select-none">
      
      {/* BEGIN: Lanyard Hardware System */}
      <header 
        onClick={handleLanyardClick}
        className={`relative z-30 flex flex-col items-center w-full cursor-pointer transition-transform duration-300 ${
          lanyardSwing ? 'animate-swing' : ''
        }`} 
        title="Tap to jiggle lanyard clasp"
        data-purpose="lanyard-hardware"
      >
        {/* Woven Yellow Lanyard Ribbon */}
        <div className="w-10 h-16 bg-[#F5B800] shadow-md border-x border-[#c98e09] flex flex-col justify-end items-center relative">
          <div className="absolute inset-y-0 left-1 w-[1px] bg-amber-600/40"></div>
          <div className="absolute inset-y-0 right-1 w-[1px] bg-amber-600/40"></div>
          {/* Metal Ribbon Clamp / Crimp */}
          <div className="w-12 h-3.5 bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 border border-zinc-500 rounded-sm shadow-sm flex items-center justify-center">
            <div className="w-10 h-[1.5px] bg-zinc-600/60"></div>
          </div>
        </div>
        {/* Metal Swivel Trigger Snap Hook Clasp */}
        <div className="relative flex flex-col items-center -mt-0.5">
          {/* Swivel Ring */}
          <div className="w-5 h-3 border-2 border-zinc-400 rounded-sm bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-inner"></div>
          {/* Golden / Metallic Spring Snap Hook penetrating the ID badge hole */}
          <svg className="w-8 h-10 drop-shadow-md -mt-1" fill="none" stroke="currentColor" viewBox="0 0 36 44">
            <defs>
              <linearGradient id="goldMetal" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#fff4b8"></stop>
                <stop offset="35%" stopColor="#f5b800"></stop>
                <stop offset="70%" stopColor="#d49400"></stop>
                <stop offset="100%" stopColor="#8a5c00"></stop>
              </linearGradient>
            </defs>
            <path d="M14 2 H22 V10 H14 Z" fill="url(#goldMetal)" stroke="#785000" strokeWidth="1"></path>
            <path d="M18 10 C12.5 15 10.5 21 11.5 29 C12.5 35 15.5 39 18 42 C20.5 39 23.5 35 24.5 29 C25.5 21 23.5 15 18 10 Z" fill="url(#goldMetal)" stroke="#664300" strokeWidth="1.2"></path>
            <path d="M16 16 L20 26" stroke="#fff9d2" strokeLinecap="round" strokeWidth="1.5"></path>
          </svg>
        </div>
      </header>
      {/* END: Lanyard Hardware System */}

      {/* BEGIN: ID Card Body with 3D Flip, Double Click & Swipe Support */}
      <main className={`relative -mt-4 w-full max-w-[380px] mb-12 perspective-1000 animate-badge-torsional ${isShaking ? 'animate-card-shake' : ''}`} data-purpose="id-badge-body">
        
        {/* Animated Radial Gradient Glow Background matching theme */}
        <div className={`absolute -inset-8 rounded-[40px] pointer-events-none transition-all duration-700 ease-in-out opacity-80 blur-2xl z-[-1] ${
          isFlipped 
            ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/35 via-purple-600/20 to-transparent animate-pulse' 
            : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-cyan-500/15 to-transparent animate-pulse'
        }`}></div>
        
        {/* Card Flipper Container */}
        <div 
          onDoubleClick={handleCardFlip}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className={`relative w-full preserve-3d transition-transform duration-700 ease-in-out cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          title="Double click or swipe left/right to flip card"
        >

          {/* FRONT FACE OF THE CARD */}
          <div 
            onMouseMove={handleCardMouseMove}
            className={`relative bg-[#ffffff] rounded-[28px] border border-zinc-200/90 badge-card-shadow px-4 pt-3 pb-5 flex flex-col overflow-hidden backface-hidden transition-opacity duration-300 ${
              isFlipped ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
            }`}
          >
            
            {/* Ephemeral Scratch Marks on Plastic Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-35 overflow-hidden">
              {scratches.map((s, index) => (
                <line
                  key={s.id}
                  x1={s.x - 14}
                  y1={s.y}
                  x2={s.x + 14}
                  y2={s.y}
                  stroke="rgba(255, 255, 255, 0.75)"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  transform={`rotate(${s.angle} ${s.x} ${s.y})`}
                  style={{ opacity: (index + 1) / scratches.length }}
                  className="transition-opacity duration-300"
                />
              ))}
            </svg>
            
            {/* Exact Wrinkled Plastic Bag PNG Texture Overlay */}
            <img 
              src="/assets/aistudio/IMG_20261023_153834_cd28ae97.png" 
              alt="Wrinkled Plastic Wrap" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30 select-none mix-blend-screen opacity-90"
            />
            <img 
              src="/assets/aistudio/IMG_20261023_153834_cd28ae97.png" 
              alt="Wrinkled Plastic Sheen" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30 select-none opacity-40 mix-blend-overlay"
            />

            {/* BEGIN: Card Header */}
            <section 
              className="relative w-full flex items-center justify-between pt-1 pb-2 px-1" 
              data-purpose="badge-header"
              style={{ transform: `translate(${tiltX * 0.4}px, ${tiltY * 0.4}px)`, transition: 'transform 0.1s ease-out' }}
            >
              {/* Left: Designer Identity & Role */}
              <div className="flex flex-col text-left leading-tight z-10">
                <span className="font-michroma text-[12px] font-bold text-black tracking-wider">SIDDHI JHA</span>
                <span className="font-michroma text-[7.5px] font-semibold text-black tracking-wider mt-0.5">SOFTWARE DEVELOPER</span>
              </div>
              {/* Center: Cutout Slot for Lanyard Hook */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 flex flex-col items-center z-10">
                <div className="w-12 h-3 bg-[#111111] rounded-full border-[1.5px] border-zinc-400 shadow-inner flex items-center justify-center">
                  <div className="w-2.5 h-3 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm opacity-95"></div>
                </div>
              </div>
              {/* Right: Real-time Live Clock */}
              <div className="flex items-center justify-end z-10">
                <span className="font-techno-capsule font-extrabold text-[12px] sm:text-[13px] leading-none text-black tracking-tight">{currentTime}</span>
              </div>
            </section>
            {/* END: Card Header */}

            {/* BEGIN: Hero Portrait Frame with Crumpled Grid Paper Background */}
            <section 
              className="relative w-full mt-1 z-20" 
              data-purpose="hero-portrait-frame"
              style={{ transform: `translate(${tiltX * 0.9}px, ${tiltY * 0.9}px)`, transition: 'transform 0.1s ease-out' }}
            >
              <div className="w-full relative border-[2.2px] border-black rounded-none overflow-hidden flex items-end justify-center aspect-[1/1.1] bg-[#f4f2ee]">
                
                {/* Crumpled Grid Paper Background Image */}
                <img 
                  src="/assets/aistudio/1000008348_d60060bf.png" 
                  alt="Crumpled Grid Paper Background" 
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                />

                {/* Interactive Cutout Portrait (Cycles Original -> PNG1 -> PNG2 -> Original) */}
                <div 
                  onClick={handlePortraitClick}
                  className="relative w-full h-[98%] flex items-end justify-center z-10 overflow-hidden cursor-pointer pointer-events-auto"
                  title="Click portrait to switch outfit/pose!"
                >
                  {portraitImages.map((src, index) => (
                    <img 
                      key={src}
                      alt={`Portrait ${index}`} 
                      src={src}
                      className={`absolute bottom-0 h-full w-auto max-w-full object-contain object-bottom select-none transition-all duration-500 ease-out transform ${
                        portraitIndex === index
                          ? 'opacity-100 scale-100 rotate-0'
                          : 'opacity-0 scale-95 -rotate-1 pointer-events-none'
                      }`} 
                      draggable={false}
                    />
                  ))}
                </div>

                {/* Top-Right Battery Status Indicator inside the portrait box */}
                <div className="absolute top-2 right-2 z-20 bg-black/75 backdrop-blur-sm text-amber-300 font-techno-capsule text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md border border-amber-500/40 shadow-sm flex items-center gap-1.5 select-none pointer-events-none">
                  <span>{batteryLevel}%</span>
                  <div className="w-5 h-2.5 border border-amber-300 rounded-[2px] p-0.5 flex items-center">
                    <div 
                      className="h-full bg-amber-400 rounded-[1px] transition-all duration-300" 
                      style={{ width: `${Math.max(10, batteryLevel)}%` }}
                    ></div>
                  </div>
                  {isCharging && <span className="text-amber-400 text-[9px]">⚡</span>}
                </div>

                {/* Spider-Man hanging upside down in Green Marked Area (Top-Left) */}
                <div
                  onClick={isSpiderManVisible ? handleSpiderManClick : undefined}
                  className={`absolute top-0 left-2 z-30 cursor-pointer select-none transition-all duration-1000 ease-in-out transform ${
                    isSpiderManVisible 
                      ? '-translate-y-0.5 opacity-100 scale-100 pointer-events-auto animate-spidey-front-float' 
                      : '-translate-y-[150%] opacity-0 pointer-events-none scale-75'
                  }`}
                  title={isSpiderManVisible ? "Tap Spider-Man to zip up and disappear!" : ""}
                >
                  <img 
                    src="/assets/aistudio/spiderman_transparent.png" 
                    alt="Spider-Man" 
                    className="w-16 sm:w-20 h-auto drop-shadow-md hover:scale-105 active:scale-95 transition-transform duration-200" 
                  />
                </div>

                {/* Iron Man peeking in Red Marked Area (Bottom-Right) */}
                <div
                  onClick={isIronManVisible ? handleIronManClick : undefined}
                  className={`absolute bottom-0 right-1 z-20 cursor-pointer select-none transition-all duration-1000 ease-in-out transform ${
                    isIronManVisible 
                      ? 'translate-y-1 opacity-100 scale-100 pointer-events-auto animate-iron-man-squeeze' 
                      : 'translate-y-[135%] opacity-0 pointer-events-none scale-75'
                  }`}
                  title={isIronManVisible ? "Tap Iron Man to slide down and disappear!" : ""}
                >
                  <img 
                    src="/assets/aistudio/ironman_transparent.png" 
                    alt="Iron Man" 
                    className="w-20 sm:w-24 h-auto drop-shadow-md hover:scale-105 active:scale-95 transition-transform duration-200" 
                  />
                </div>

              </div>
            </section>
            {/* END: Hero Portrait */}

            {/* BEGIN: Middle Typography Row */}
            <section className="w-full mt-3 mb-2 px-0.5 flex items-center justify-between gap-2" data-purpose="typography-title-row">
              <div className="flex flex-col leading-[1.1] shrink-0 group cursor-default">
                <span className="font-michroma text-[9px] font-bold tracking-wider text-black uppercase transition-colors group-hover:text-amber-600">HACK. BUILD.</span>
                <span className="font-michroma text-[9px] font-bold tracking-wider text-black mt-0.5 uppercase transition-colors group-hover:text-amber-600">REPEAT.</span>
              </div>
              <div className="flex-1 text-right overflow-hidden group cursor-default">
                <h2 className="font-wide-trotoart text-[21px] sm:text-[23px] font-bold text-black tracking-tight uppercase whitespace-nowrap inline-block transition-colors group-hover:text-amber-600">SIDDHI.DEV</h2>
              </div>
            </section>
            {/* END: Middle Typography Row */}

            {/* BEGIN: Bottom Section Dual Cards */}
            <section className="w-full grid grid-cols-2 gap-2.5 items-stretch relative mt-0.5 pb-1" data-purpose="info-modules">
              
              {/* LEFT MODULE: Dark Charcoal Box with Laser Scan Effect */}
              <article 
                onClick={handleBarcodeCardClick}
                className="bg-[#111111] rounded-[2px] p-2 flex flex-col justify-between relative shadow-sm text-white min-h-[96px] cursor-pointer hover:border-amber-400/50 border border-transparent transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] overflow-hidden" 
                data-purpose="bio-and-typography-box"
                title="Click to scan barcode with sound effect"
              >
                {/* Cyan Laser Scanline on click */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] pointer-events-none z-20 animate-scanline"></div>
                )}

                <div className="flex justify-between items-start gap-1">
                  <div className="text-[9px] font-space font-medium leading-[1.3] text-zinc-300">
                    <p>Hi, I'm Siddhi, building the web</p>
                    <p>from pixels to servers,</p>
                    <p>and cracking logic with C++ & DSA.</p>
                  </div>
                  {/* Clean Crisp Vertical White Barcode with numbers */}
                  <div className="flex flex-col items-center flex-shrink-0 relative">
                    <svg className={`h-8 w-4 text-white transition-opacity ${isScanning ? 'opacity-70' : 'opacity-100'}`} fill="currentColor" viewBox="0 0 20 48">
                      <rect height="40" width="1.8" x="0" y="0"></rect>
                      <rect height="40" width="0.9" x="3" y="0"></rect>
                      <rect height="40" width="2.4" x="5.5" y="0"></rect>
                      <rect height="40" width="1.2" x="9" y="0"></rect>
                      <rect height="40" width="0.8" x="11.5" y="0"></rect>
                      <rect height="40" width="2.6" x="13.5" y="0"></rect>
                      <rect height="40" width="1.5" x="17.2" y="0"></rect>
                      <text fill="#ffffff" fontFamily="'Space Grotesk', monospace" fontSize="4.5" letterSpacing="0.5" textAnchor="middle" x="10" y="47">89024</text>
                    </svg>
                  </div>
                </div>
                <div className="mt-3 leading-none">
                  <p className="font-michroma text-[10.5px] font-extrabold tracking-tight text-[#ffcc00]">FULLSTACK</p>
                  <p className="font-michroma text-[11px] font-black tracking-tight text-white mt-1">DEVELOPER</p>
                </div>
              </article>

              {/* RIGHT MODULE: Solid White Background with Chime & Copy Feedback */}
              <article 
                onClick={handleContactCardClick}
                className="bg-white rounded-[2px] p-2 flex flex-col justify-between shadow-sm min-h-[96px] text-black border border-zinc-200/80 cursor-pointer hover:border-black transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] relative" 
                data-purpose="ranking-and-credits-box"
                title="Click to copy contact details"
              >
                {copiedContact && (
                  <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[6px] font-bold px-1.5 py-0.5 rounded shadow z-20 animate-bounce">
                    COPIED!
                  </div>
                )}

                <div>
                  <div className="w-full h-[1px] bg-zinc-300 mt-1 mb-1.5 opacity-0"></div>
                  <div className="text-center py-0.5">
                    <h3 className="font-serif-display text-[19px] font-black text-black tracking-wider leading-none">CONTACT</h3>
                    <div className="w-12 h-[1.5px] bg-black mx-auto mt-1"></div>
                  </div>
                </div>
                <div>
                  <div className="w-full h-[1px] bg-zinc-300 mb-1 mt-1"></div>
                  <div className="text-[8px] text-zinc-600 font-space text-center leading-[1.4] font-normal">
                    <p>Phone: 8289640516</p>
                    <p className="mt-0.5">Email: siddhikumarjha356@gmail.com</p>
                  </div>
                </div>
              </article>

              {/* Decorative Yellow Masking Tape "X" Cross with Peel Wobble & Sound */}
              <div 
                onClick={handleTapeClick}
                className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-40 cursor-pointer" 
                data-purpose="decorative-tape-cross"
                title="Tap tape to peel"
              >
                <div className={`relative w-10 h-10 flex items-center justify-center ${tapeBounce ? 'animate-tape-bounce' : ''}`}>
                  <div className="absolute w-10 h-3.5 tape-strip-realistic -rotate-45 transform"></div>
                  <div className="absolute w-10 h-3.5 tape-strip-realistic rotate-45 transform"></div>
                </div>
              </div>

            </section>
            {/* END: Bottom Section Dual Cards */}

          </div>

          {/* BACK FACE OF THE CARD MATCHING SCREENSHOT */}
          <div className={`absolute inset-0 bg-[#e1e2de] rounded-[28px] border border-zinc-200/90 badge-card-shadow flex flex-col overflow-hidden backface-hidden rotate-y-180 transition-opacity duration-300 ${
            isFlipped ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}>
            
            {/* Cyber Base Background Template from Projects_20261023_214025_0000_2ed6ee21.png */}
            <img 
              src="/assets/aistudio/Projects_20261023_214025_0000_2ed6ee21.png" 
              alt="Cyber Badge Back Template" 
              className="absolute inset-0 w-full h-full object-cover select-none" 
              draggable={false}
            />

            {/* Spider-Verse Characters Hanging System Emerging From Inside Black Pill Bar */}
            <div className="absolute inset-x-0 top-[4.5%] bottom-0 overflow-hidden pointer-events-none z-20">
              {/* Row anchored so top of web lines sits at 8.0% of card, firmly inside the black bar (ending at 10.16%) */}
              <div className="absolute inset-x-0 top-[3.5%] flex items-start justify-center gap-1.5 sm:gap-2.5">
                
                {/* Spider-Gwen (Left) */}
                <div 
                  className="pointer-events-auto"
                  style={{
                    transform: charactersDeployed ? 'translateY(0)' : 'translateY(-140%)',
                    opacity: charactersDeployed ? 1 : 0,
                    transition: charactersDeployed 
                      ? 'transform 540ms cubic-bezier(0.18, 0.89, 0.32, 1.2), opacity 320ms ease-out'
                      : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 240ms ease-in'
                  }}
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('zip');
                      if (navigator.vibrate) { try { navigator.vibrate(30); } catch {} }
                      setGwenSwing(true);
                      setTimeout(() => setGwenSwing(false), 800);
                    }}
                    className={`cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 ${
                      gwenSwing ? 'animate-swing' : (charactersDeployed ? 'animate-continuous-swing-gwen' : '')
                    }`}
                    title="Tap Spider-Gwen to swing"
                  >
                    <img 
                      src="/assets/aistudio/gwen_transparent.png" 
                      alt="Spider-Gwen" 
                      className="w-10 sm:w-11 h-auto drop-shadow-md select-none" 
                      draggable={false}
                    />
                  </div>
                </div>

                {/* Classic Spider-Man Hanging Upside Down (Center) */}
                <div 
                  className="pointer-events-auto"
                  style={{
                    transform: charactersDeployed ? 'translateY(0)' : 'translateY(-140%)',
                    opacity: charactersDeployed ? 1 : 0,
                    transition: charactersDeployed 
                      ? 'transform 570ms cubic-bezier(0.18, 0.89, 0.32, 1.2) 40ms, opacity 320ms ease-out'
                      : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1) 25ms, opacity 240ms ease-in'
                  }}
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('zip');
                      if (navigator.vibrate) { try { navigator.vibrate([35, 30, 35]); } catch {} }
                      setSpideySwing(true);
                      setTimeout(() => setSpideySwing(false), 800);
                    }}
                    className={`cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 ${
                      spideySwing ? 'animate-swing' : (charactersDeployed ? 'animate-continuous-swing-spidey' : '')
                    }`}
                    title="Tap Spider-Man to swing"
                  >
                    <img 
                      src="/assets/aistudio/spiderman_hanging_transparent.png" 
                      alt="Spider-Man" 
                      className="w-8 sm:w-9 h-auto drop-shadow-md select-none" 
                      draggable={false}
                    />
                  </div>
                </div>

                {/* Miles Morales (Right) */}
                <div 
                  className="pointer-events-auto"
                  style={{
                    transform: charactersDeployed ? 'translateY(0)' : 'translateY(-140%)',
                    opacity: charactersDeployed ? 1 : 0,
                    transition: charactersDeployed 
                      ? 'transform 550ms cubic-bezier(0.18, 0.89, 0.32, 1.2) 80ms, opacity 320ms ease-out'
                      : 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1) 50ms, opacity 240ms ease-in'
                  }}
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('zip');
                      if (navigator.vibrate) { try { navigator.vibrate(30); } catch {} }
                      setMilesSwing(true);
                      setTimeout(() => setMilesSwing(false), 800);
                    }}
                    className={`cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 ${
                      milesSwing ? 'animate-swing' : (charactersDeployed ? 'animate-continuous-swing-miles' : '')
                    }`}
                    title="Tap Miles Morales to swing"
                  >
                    <img 
                      src="/assets/aistudio/miles_transparent.png" 
                      alt="Miles Morales" 
                      className="w-9 sm:w-10 h-auto drop-shadow-md select-none" 
                      draggable={false}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Socials Card Box (Projects_20261024_092711_0000_b1e44c21.png) Placed in User Red-Marked Zone */}
            <div className="absolute top-[23.5%] left-1/2 -translate-x-1/2 w-[82%] max-w-[285px] z-10 select-none pointer-events-none">
              <img 
                src="/assets/aistudio/Projects_20261024_092711_0000_b1e44c21.png" 
                alt="Socials Card Box" 
                className="w-full h-auto object-contain select-none drop-shadow-sm" 
                draggable={false}
              />
            </div>

            {/* Socials Card Content: Shifting lower down with user specific profile links */}
            <div className="absolute top-[36.5%] left-1/2 -translate-x-1/2 w-[80%] max-w-[265px] z-50 pointer-events-auto grid grid-cols-2 gap-x-3 gap-y-2 items-center justify-items-center text-center">
              
              {/* GitHub */}
              <button 
                type="button"
                onClick={(e) => handleSocialButtonClick('GitHub', 'https://github.com/siddhijha-Arc', e)}
                onMouseDown={(e) => {
                  buttonTouchStartRef.current = { x: e.clientX, y: e.clientY };
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) {
                    buttonTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }
                }}
                className="flex flex-col items-center justify-center group cursor-pointer w-full relative z-50 pointer-events-auto select-none bg-transparent border-none outline-none p-0"
                title="GitHub Profile"
              >
                <img 
                  src="/assets/aistudio/How_GitHub_braved_the_worlds_largest_DDoS_attack_879a19cf.jpeg" 
                  alt="GitHub" 
                  className="w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] object-cover rounded-full select-none group-hover:scale-110 active:scale-95 transition-transform filter drop-shadow-md pointer-events-none" 
                  draggable={false}
                />
                <span className="font-michroma text-[10px] sm:text-[11.5px] font-black text-black mt-0.5 tracking-tight pointer-events-none">GitHub</span>
              </button>

              {/* X / Twitter */}
              <button 
                type="button"
                onClick={(e) => handleSocialButtonClick('X', 'https://x.com/Siddk_jha', e)}
                onMouseDown={(e) => {
                  buttonTouchStartRef.current = { x: e.clientX, y: e.clientY };
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) {
                    buttonTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }
                }}
                className="flex flex-col items-center justify-center group cursor-pointer w-full relative z-50 pointer-events-auto select-none bg-transparent border-none outline-none p-0"
                title="X Profile"
              >
                <img 
                  src="/assets/aistudio/x_icon_transparent.png" 
                  alt="X" 
                  className="w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] object-contain select-none group-hover:scale-110 active:scale-95 transition-transform filter drop-shadow-md pointer-events-none" 
                  draggable={false}
                />
                <span className="font-michroma text-[10px] sm:text-[11.5px] font-black text-black mt-0.5 tracking-tight pointer-events-none">X</span>
              </button>

              {/* LinkedIn */}
              <button 
                type="button"
                onClick={(e) => handleSocialButtonClick('LinkedIn', 'https://www.linkedin.com/in/siddhi-kumar-jha-aa4725433?utm_source=share_via&utm_content=profile&utm_medium=member_android', e)}
                onMouseDown={(e) => {
                  buttonTouchStartRef.current = { x: e.clientX, y: e.clientY };
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) {
                    buttonTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }
                }}
                className="flex flex-col items-center justify-center group cursor-pointer w-full relative z-50 pointer-events-auto select-none bg-transparent border-none outline-none p-0"
                title="LinkedIn Profile"
              >
                <img 
                  src="/assets/aistudio/linkedin_icon_transparent.png" 
                  alt="LinkedIn" 
                  className="w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] object-contain select-none group-hover:scale-110 active:scale-95 transition-transform filter drop-shadow-md pointer-events-none" 
                  draggable={false}
                />
                <span className="font-michroma text-[10px] sm:text-[11.5px] font-black text-black mt-0.5 tracking-tight pointer-events-none">LinkedIn</span>
              </button>

              {/* Instagram */}
              <button 
                type="button"
                onClick={(e) => handleSocialButtonClick('Instagram', 'https://www.instagram.com/siddhi_jha._?obrf=NnVtOTVtdmpybzh2', e)}
                onMouseDown={(e) => {
                  buttonTouchStartRef.current = { x: e.clientX, y: e.clientY };
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) {
                    buttonTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }
                }}
                className="flex flex-col items-center justify-center group cursor-pointer w-full relative z-50 pointer-events-auto select-none bg-transparent border-none outline-none p-0"
                title="Instagram Profile"
              >
                <img 
                  src="/assets/aistudio/instagram_icon_transparent.png" 
                  alt="Instagram" 
                  className="w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] object-contain select-none group-hover:scale-110 active:scale-95 transition-transform filter drop-shadow-md pointer-events-none" 
                  draggable={false}
                />
                <span className="font-michroma text-[10px] sm:text-[11.5px] font-black text-black mt-0.5 tracking-tight pointer-events-none">Instagram</span>
              </button>

            </div>

            {/* Wrinkled Plastic Bag Texture Overlay on Back Face for Realistic Polythene Sheen */}
            <img 
              src="/assets/aistudio/IMG_20261023_153834_cd28ae97.png" 
              alt="Wrinkled Plastic Wrap" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30 select-none mix-blend-screen opacity-75"
            />
            <img 
              src="/assets/aistudio/IMG_20261023_153834_cd28ae97.png" 
              alt="Wrinkled Plastic Sheen" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30 select-none opacity-30 mix-blend-overlay"
            />

          </div>

        </div>

        {/* Interactive Gesture Hint Pill */}
        <div 
          onClick={handleCardFlip}
          className="text-center mt-3 text-[10px] text-zinc-400 font-mono tracking-wider opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>{isFlipped ? '🔄 Double-click or swipe to flip back to front' : '🔄 Double-click or swipe left/right to flip card'}</span>
        </div>

      </main>
      {/* END: ID Card Body */}

      {/* Transparent Yellow Popup Modal */}
      {socialModal && (
        <div 
          onClick={() => setSocialModal(null)}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[320px] bg-yellow-400/90 backdrop-blur-md border-[2.5px] border-yellow-300 rounded-2xl p-5 shadow-[0_0_30px_rgba(250,204,21,0.4)] text-black flex flex-col items-center text-center animate-pop-in relative overflow-hidden"
          >
            {/* Glossy sheen reflection */}
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-white/40 rounded-full blur-xl pointer-events-none"></div>

            {/* Platform Tag Badge */}
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-md mb-3 border border-amber-300/80">
              <span className="font-michroma text-[11px] font-black text-amber-300 tracking-wider uppercase">
                {socialModal.platform === 'Instagram' ? 'IG' : socialModal.platform === 'LinkedIn' ? 'IN' : socialModal.platform === 'GitHub' ? 'GH' : 'X'}
              </span>
            </div>

            {/* Short Crisp English Notification Text */}
            <h3 className="font-michroma text-[13px] font-black text-black tracking-wide uppercase mb-1">
              OPENING PROFILE
            </h3>
            <p className="font-space text-[12px] font-bold text-zinc-900 leading-snug mb-5 px-1">
              Opening Siddhi Jha's <span className="underline decoration-black underline-offset-2">{socialModal.platform}</span> page.
            </p>

            {/* Action Buttons: OK and LATER */}
            <div className="flex items-center justify-center gap-3 w-full">
              <button
                onClick={() => setSocialModal(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-black/15 hover:bg-black/25 active:scale-95 text-black font-michroma text-[11px] font-bold tracking-wider transition-all border border-black/25"
              >
                LATER
              </button>
              <button
                onClick={() => {
                  window.open(socialModal.url, '_blank', 'noopener,noreferrer');
                  setSocialModal(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-black hover:bg-zinc-900 active:scale-95 text-amber-300 font-michroma text-[11px] font-black tracking-wider shadow-lg transition-all border border-black"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
