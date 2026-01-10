export const initialData = {
  currentUser: {
    username: 'frostfoe',
    name: 'জয় বাংলা',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=frostfoe',
    bio: `আলু খাবে?
চলো জীবনটা প্যরাহীন করি 🔥`,
    stats: { posts: 5, followers: 1, following: 3 }
  },
  stories: [
    { id: 101, username: 'dragonpool18', img: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&auto=format&fit=crop&q=60' },
    { id: 102, username: 'your_story', img: 'https://images.unsplash.com/photo-1511765224389-37f0e77cf0eb?w=800&auto=format&fit=crop&q=60', isUser: true },
    { id: 103, username: 'friend_1', img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&auto=format&fit=crop&q=60' },
    { id: 104, username: 'friend_2', img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&auto=format&fit=crop&q=60' },
    { id: 105, username: 'friend_3', img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60' },
  ],
  notes: [
    { id: 1, user: { username: 'dragonpool18', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dragonpool18' }, text: 'আজকে বিরিয়ানি খাবো 🍗' },
    { id: 2, user: { username: 'leniepabelonia_', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=leniepabelonia_' }, text: 'জিম টাইম 💪' },
    { id: 3, user: { username: 'bolt.motivation', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=bolt.motivation' }, text: 'কাজ আর কাজ 😫' },
    { id: 4, user: { username: 'nutshell_today', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nutshell_today' }, text: 'নতুন ভিডিও আসছে!' },
  ],
  posts: [
    {
      id: 201,
      user: {
        username: 'dragonpool18',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dragonpool18'
      },
      content: { type: 'video', poster: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60' },
      likes: '8K',
      caption: 'স্পিন সাইড কিক (Spin side kick)',
      comments: 47,
      time: '২ঘ',
      isVerified: false,
      commentList: [
        { user: 'karimjovian', text: 'অসাধারণ! 🔥' },
        { user: 'nfa.rha', text: 'দারুণ!' }
      ]
    },
    {
      id: 202,
      user: {
        username: 'nasa',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nasa'
      },
      content: { type: 'image', src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60' },
      likes: '1.2M',
      caption: "চাঁদের উল্টো পিঠে দেখা হবে... 🌕",
      comments: '৪.৯K',
      time: '৫ঘ',
      isVerified: true,
      commentList: []
    },
    {
      id: 203,
      user: {
        username: 'leniepabelonia_',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=leniepabelonia_'
      },
      content: { type: 'image', src: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800&auto=format&fit=crop&q=60' },
      likes: '৩১৭.৮K',
      caption: 'তাড়াহুড়ো করার জন্য বড্ড ছোট, কিন্তু সময় নষ্ট করার জন্য বড্ড বড়।',
      comments: 479,
      time: '১২ঘ',
      isVerified: false,
      commentList: []
    },
    {
      id: 204,
      user: {
        username: 'bolt.motivation',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=bolt.motivation'
      },
      content: { type: 'image', src: 'https://images.unsplash.com/photo-1571019613454-1cb2f98b2d8b?w=800&auto=format&fit=crop&q=60' },
      likes: '১.৩K',
      caption: 'তার পুরো শরীর অবশ হয়ে আসছিল... 😱🎾',
      comments: 15,
      time: '১দিন',
      isVerified: false,
      commentList: []
    },
    {
      id: 205,
      user: {
        username: 'nutshell_today',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nutshell_today'
      },
      content: { type: 'image', src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&auto=format&fit=crop&q=60' },
      likes: '৩.৫K',
      caption: "অস্ট্রেলিয়ার স্বরাষ্ট্র দপ্তর বাংলাদেশকে অ্যাসেসমেন্ট লেভেল ১ থেকে লেভেল ৩ (সর্বোচ্চ ঝুঁকিপূর্ণ) এ নামিয়ে দিয়েছে।",
      comments: 76,
      time: '৪ঘ',
      isVerified: true,
      commentList: []
    }
  ],
  messages: [
    {
      id: 301,
      user: {
        username: 'Nawshin Sharmily',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nawshin'
      },
      lastMessage: 'নওশিন একটি এটাচমেন্ট পাঠিয়েছে',
      time: '১স',
      unread: false,
      chatHistory: [
        { type: 'date', text: '১৩ নভেম্বর ২০২৫' },
        {
          type: 'incoming',
          contentType: 'image',
          src: 'https://images.unsplash.com/photo-1492633423870-43d1cd27758?w=800&auto=format&fit=crop&q=60',
          timestamp: '১০:০৭'
        },
        { type: 'date', text: '২৩ ডিসেম্বর ২০২৫' },
        {
          type: 'incoming',
          contentType: 'profile',
          username: '_n4w5h1n_',
          avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=_n4w5h1n_',
          timestamp: '২০:২৭'
        },
        { type: 'date', text: '২৮ ডিসেম্বর ২০২৫' },
        {
          type: 'incoming',
          contentType: 'profile',
          username: 'UY Lab',
          avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=UYLab',
          timestamp: '০৯:৪৯'
        },
        {
          type: 'incoming',
          contentType: 'post',
          src: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&auto=format&fit=crop&q=60',
          caption: '💹 মাইক্রোসফট এক্সেলে সঠিক দক্ষতা না থাকার কারনে অফিসে বসের রেগুলার ঝারি খাচ্ছেন? ডাটা র‍্যাংকিং,কম্বাইনিং টেক্সট...', 
          timestamp: '০৯:৪৯'
        },
        { type: 'date', text: '২৯ ডিসেম্বর ২০২৫' },
        {
          type: 'incoming',
          contentType: 'profile',
          username: 'fariyakabir_22',
          avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=fariyakabir_22',
          timestamp: '২২:০৯'
        },
        {
          type: 'incoming',
          contentType: 'profile',
          username: 'karimjovian',
          avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=karimjovian',
          timestamp: '২২:০৯',
          isVerified: true
        },
        {
          type: 'incoming',
          contentType: 'post',
          src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60',
          caption: 'ক্লিপ',
          timestamp: '২২:০৯'
        }
      ]
    },
    {
      id: 302,
      user: {
        username: 'dragonpool18',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dragonpool18'
      },
      lastMessage: 'আপনার স্টোরিতে রিএক্ট করেছেন',
      time: '২ঘ',
      unread: true
    },
    {
      id: 303,
      user: { username: 'bolt.motivation', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=bolt.motivation' },
      lastMessage: 'চালিয়ে যাও! 🔥',
      time: '১দিন',
      unread: false
    }
  ],
  notifications: [
    {
      id: 401,
      type: 'follow',
      user: {
        username: '_n4w5h1n_',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=_n4w5h1n_'
      },
      text: 'আপনাকে ফলো করা শুরু করেছেন।',
      time: '১০ অক্টোবর',
      isFollowing: true
    },
    {
      id: 402,
      type: 'system',
      text: "একই অ্যাকাউন্টস সেন্টারে ১টি অ্যাকাউন্ট যোগ করার পর আমরা আপনার সেটিংস আপডেট করেছি।",
      time: '২৪ সেপ',
      icon: 'meta'
    }
  ],
  suggestedUsers: [
    { username: 'shahriar_0sman', name: 'Shahriar Osman', subtitle: 'আপনার জন্য প্রস্তাবিত', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=shahriar_0sman' },
    { username: 'hasanatrn121', name: 'Hasanat Jahin Ratun', subtitle: 'আপনার জন্য প্রস্তাবিত', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=hasanatrn121' },
    { username: 'nafis_sadique_orko', name: 'nafis sadique', subtitle: 'আপনার জন্য প্রস্তাবিত', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nafis_sadique_orko' },
    { username: 'nfa.rha', name: 'Navila Farha', subtitle: 'আপনার জন্য প্রস্তাবিত', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nfa.rha' },
    { username: 'estiak_ifan_75_', name: 'Md Eastiak Ifan', subtitle: 'আপনার জন্য প্রস্তাবিত', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=estiak_ifan_75_' },
    { username: 'dipa_aaaaaa_', name: 'Dipa✨', subtitle: '_n4w5h1n_ ফলো করেন', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dipa_aaaaaa_' },
    { username: 'mn0033975', name: 'Md Nayem', subtitle: 'আপনার জন্য প্রস্তাবিত', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mn0033975' },
    { username: 'likhon_shil_', name: 'Likhon Shil', subtitle: 'আপনার জন্য প্রস্তাবিত', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=likhon_shil_' }
  ],
  reels: [
    {
      id: 501,
      user: { username: 'maybe__tisha', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=maybe__tisha' },
      src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60',
      likes: '৭৫.৭হাজার',
      comments: '১,১৫০',
      caption: '🌚🤌🏻 #foryou #foryourpage',
      audio: 'maybe__tisha · অরিজিনাল অডিও'
    },
    {
      id: 502,
      user: { username: 'midnight_rebel69', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=midnight_rebel69' },
      src: 'https://images.unsplash.com/photo-1611558709796-cfd53086eb2d?w=800&auto=format&fit=crop&q=60',
      likes: '৩১৭.৮হাজার',
      comments: '৪৭৯',
      caption: "ভিডিওটিতে একটি কোরিয়ান দম্পতিকে...",
      audio: 'midnight_rebel69 · অরিজিনাল অডিও'
    },
    {
      id: 503,
      user: { username: 'speediety', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=speediety' },
      src: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=60',
      likes: '১.৩হাজার',
      comments: '১৫',
      caption: 'গতির নেশায় শেষ স্টপেজ 🚆💨',
      audio: 'speediety · অরিজিনাল অডিও'
    }
  ],
  explore: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1469474968028-56623f02e486?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1501854140884-0704f2b21d25?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1433086966358-54859a0ed716?w=800&auto=format&fit=crop&q=60'
  ]
};