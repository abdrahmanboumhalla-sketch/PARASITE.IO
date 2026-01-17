const CONFIG = {
    WIDTH: 1920, HEIGHT: 1080, parent: 'game-container', // VOEG DIT TOE
    PLAYER: { SPEED: 400, SIZE: 80, INFECTION_RANGE: 150 },
    HOST: { 
        SPEED: 160, 
        SIZE: 70, 
        INITIAL_COUNT: 100, // Meer hosts nodig voor een grotere map!
        MIN_COUNT: 150 
    }, 
    BOT: { 
        COUNT: 25, // 99 bots + jij = 100 spelers
        SPEED: 350, 
        SIZE: 75, 
        INFECTION_RANGE: 160,
        NAMES: [
            // --- POPULAIR & STREAMERS ---
            'KaiCenat', 'IShowSpeed', 'Caseoh', 'Jynxzi', 'Sketch', 'AdinRoss', 'Clix', 'Mongraal', 'Savage', 'StableRonaldo', 'Tfue', 'Ninja', 'NickEh30', 'TypicalGamer', 'SypherPK', 'MrBeast', 'LazarBeam', 'Dream', 'Techno', 'Quackity', 'Sapnap', 'GeorgeNotFound', 'Speedy', 'Fanum', 'DukeDennis', 'Agent00', 'ChrisMD', 'LoganPaul', 'JakePaul', 'KSI',
            
            // --- POLITIEK & MEMES ---
            'DonaldTrump', 'JoeBiden', 'ElonMusk', 'Obama', 'Putin', 'KimJongUn', 'AndrewTate', 'TopG', 'TristanTate', 'Hasbulla', 'AbduRozik', 'GigaChad', 'Sigma', 'Skibidi', 'Grimace', 'BabyGronk', 'LivvyDunne', 'OhioKing', 'Rizzler', 'Gyatt', 'FanumTax', 'MewingKing', 'Looksmaxxer', 'Mogger', 'Zesty', 'BlueSmurfCat', 'Zuckerberg', 'Bezos', 'Trump2024', 'MAGA',
            
            // --- SWEATY NAMES (Echte gamer vibes) ---
            'v_Rxze', 'Lnxly', 'Spxctre', 'Nxva', 'Krxnky', 'Vxz', 'Zxy', 'Silent', 'Void', 'Eternal', 'Inferno', 'Blizzard', 'Zenith', 'Apex', 'Vanguard', 'Ghost', 'Shadow', 'Darkness', 'Vivid', 'Aqua', 'Cold', 'Unknown', 'Fnxly', 'Kxrge', 'Dread', 'Rift', 'Vortex', 'Kyz', 'Sly', 'Fxy', 'Bly', 'Wavy', 'Slumped', 'Dozing', 'Hated', 'Loved', 'Broken', 'Fixed',
            
            // --- NEDERLANDS / REALISTISCH ---
            'Bram2012', 'Luca_NL', 'Daan07', 'Senne_09', 'Finn2011', 'Noah_Bruh', 'Liam06', 'Milan_fr', 'Sem2013', 'Levi_King', 'Julian_v', 'Jesse2010', 'Thomas08', 'Ruben_x', 'Lars_05', 'Thijs_2012', 'Sven_NL', 'Gijs_fr', 'Kasper_00', 'Max2014', 'Bas_Sigma', 'Niek_Rizz', 'Timo_Bruh', 'Hugo2011', 'Meis_x', 'Twan', 'Stijn', 'Meike', 'Sophie', 'Emma_09', 'Lotte', 'Tess', 'Floor', 'Sanne', 'Noa',
            
            // --- EXTRA VARIATIES (Om de 500 te halen) ---
            'Player1', 'Player99', 'Bot_01', 'DefaultSkin', 'NoobMaster69', 'FortniteKid', 'Robloxian', 'Builderman', 'AdoptMeFan', 'Preppy', 'BaconHair', 'Cringe', 'EdgeMaster', 'ShadowRealm', 'Cobra', 'Titan', 'Nuke', 'Plague', 'Infection', 'Parasite', 'Swarm', 'Alpha', 'Beta', 'Omega', 'Loner', 'Clown', 'Troll', 'Youtuber', 'Streamer', 'TwitchMod', 'DiscordAdmin', 'Anonymous', 'Hacker', 'MoneyMaker', 'CryptoKing', 'BitcoinMiner', 'NFT_Bro'
            // [Hier kun je zelf nog makkelijk namen aan toevoegen door deze lijst te kopieren en kleine aanpassingen te doen]
        ]
    },





    POWERUP: { SPAWN_INTERVAL: 8000, SIZE: 110 }, 
    WORLD: { WIDTH: 6000, HEIGHT: 6000 }, // Massive map expansion
    COLORS: { PLAYER: 0x00ff88, BOT: 0xff3333 }
};

const ASSETS = {
    PARASITE: "parasite.webp",
    HOST_HEALTHY: 'host-healthy.webp',
    HOST_INFECTED: 'host-infected.webp',
    BACKGROUND: 'background.webp',
    CROWN: 'crown.png',
    SPEED: 'speed.png',
    MAGNET: 'magnet.png',
    X2: 'x2.png',
};