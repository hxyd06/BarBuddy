// Module completion messages with summaries and next steps
export const moduleCompletionMessages = {
  'beginner-1': {
    title: 'Essential Bar Tools Mastered',
    emoji: '🔨',
    learned: [
      'Professional bar tool setup',
      'Proper glassware selection',
      'Efficient workspace organization'
    ],
    nextStep: 'You\'re ready for "Basic Mixing Techniques" module!',
    isLastInLevel: false
  },
  'beginner-2': {
    title: 'Basic Mixing Techniques Mastered',
    emoji: '🥃',
    learned: [
      'When to shake vs stir',
      'Professional shaking technique', 
      'Proper stirring methods'
    ],
    nextStep: 'You\'re ready for "Understanding Base Spirits" module!',
    isLastInLevel: false
  },
  'beginner-3': {
    title: 'Understanding Base Spirits Mastered',
    emoji: '🍷',
    learned: [
      'Six major spirit categories',
      'Spirit production basics',
      'Quality selection for cocktails'
    ],
    nextStep: 'You can now attempt beginner quizzes:',
    availableQuizzes: [
      'Bartending Fundamentals',
      'Essential Bartending Skills'
    ],
    isLastInLevel: true
  },
  'intermediate-1': {
    title: 'Cocktail Balance & Recipe Development Mastered',
    emoji: '⚖️',
    learned: [
      'Five elements of cocktail balance',
      'Advanced sweetening techniques',
      'Acid balance and citrus selection'
    ],
    nextStep: 'You\'re ready for "Advanced Ingredients & Infusions" module!',
    isLastInLevel: false
  },
  'intermediate-2': {
    title: 'Advanced Ingredients & Infusions Mastered',
    emoji: '🧪',
    learned: [
      'Creating spirit infusions',
      'Crafting flavored syrups',
      'Working with bitters and tinctures'
    ],
    nextStep: 'You\'re ready for "Ice Mastery & Temperature Control" module!',
    isLastInLevel: false
  },
  'intermediate-3': {
    title: 'Ice Mastery & Temperature Control Mastered',
    emoji: '🧊',
    learned: [
      'Understanding ice types and applications',
      'Creating perfect clear ice',
      'Temperature control and service'
    ],
    nextStep: 'You can now attempt intermediate quizzes:',
    availableQuizzes: [
      'Cocktail Balance & Techniques',
      'Advanced Ingredients & Infusions'
    ],
    isLastInLevel: true
  },
  'advanced-1': {
    title: 'Molecular Mixology Fundamentals Mastered',
    emoji: '⚗️',
    learned: [
      'Spherification techniques',
      'Foam and air techniques',
      'Gelification and texturization'
    ],
    nextStep: 'You\'re ready for "Flavor Chemistry & Pairing Theory" module!',
    isLastInLevel: false
  },
  'advanced-2': {
    title: 'Flavor Chemistry & Pairing Theory Mastered',
    emoji: '🔬',
    learned: [
      'Understanding flavor compounds',
      'Advanced pairing strategies',
      'Seasonal and terroir considerations'
    ],
    nextStep: 'You\'re ready for "Professional Bar Management" module!',
    isLastInLevel: false
  },
  'advanced-3': {
    title: 'Professional Bar Management Mastered',
    emoji: '💼',
    learned: [
      'Cost control and inventory management',
      'Menu engineering and pricing',
      'Staff training and quality control'
    ],
    nextStep: 'You can now attempt advanced quizzes:',
    availableQuizzes: [
      'Modern Mixology Techniques',
      'Professional Bar Management'
    ],
    isLastInLevel: true
  }
};

// Quiz unlock logic - defines which quizzes are available at each tier
export const quizUnlockTiers = {
  tier1: ['quiz-1', 'quiz-2'],           // Always available (beginner)
  tier2: ['quiz-3', 'quiz-4'],                    // Unlock after tier1 passed
  tier3: ['quiz-5', 'quiz-6']                     // Unlock after tier2 passed
};

// Quiz tier mapping for easy lookup
export const quizTierMap = {
  'quiz-1': 1,
  'quiz-2': 1,
  'quiz-3': 2,
  'quiz-4': 2,
  'quiz-5': 3,
  'quiz-6': 3
};

// Messages for locked quizzes
export const lockedQuizMessages = {
  tier2: {
    title: '🔒 LOCKED',
    message: 'Complete the beginner quizzes first to unlock intermediate quizzes.',
    progress: 'Beginner Quizzes'
  },
  tier3: {
    title: '🔒 LOCKED', 
    message: 'Complete the intermediate quizzes first to unlock advanced quizzes.',
    progress: 'Intermediate Quizzes'
  }
};

// Final completion message after last quiz
export const finalCompletionMessage = {
  title: 'BARTENDING MASTERY COMPLETE',
  emoji: '🏆',
  subtitle: 'Congratulations on your incredible achievement!',
  summary: [
    '9 Modules completed',
    '6 Quizzes passed', 
    'All skill levels mastered'
  ],
  mastered: [
    'Essential bartending tools',
    'Professional mixing techniques',
    'Advanced ingredient knowledge', 
    'Modern mixology methods',
    'Professional bar management'
  ],
  finalMessage: 'You\'re now ready to create amazing cocktails and run a professional bar operation!'
};

// Helper functions
export const isQuizUnlocked = (quizId: string, completedQuizzes: string[]): boolean => {
  const tier = quizTierMap[quizId as keyof typeof quizTierMap];
  
  if (tier === 1) return true; // Tier 1 always unlocked
  
  if (tier === 2) {
    // Check if all tier 1 quizzes are completed
    return quizUnlockTiers.tier1.every(quiz => completedQuizzes.includes(quiz));
  }
  
  if (tier === 3) {
    // Check if all tier 2 quizzes are completed
    return quizUnlockTiers.tier2.every(quiz => completedQuizzes.includes(quiz));
  }
  
  return false;
};

export const getLockedQuizMessage = (quizId: string, completedQuizzes: string[]) => {
  const tier = quizTierMap[quizId as keyof typeof quizTierMap];
  
  if (tier === 2) {
    const completedTier1 = quizUnlockTiers.tier1.filter(quiz => completedQuizzes.includes(quiz)).length;
    return {
      ...lockedQuizMessages.tier2,
      currentProgress: `${completedTier1}/${quizUnlockTiers.tier1.length}`
    };
  }
  
  if (tier === 3) {
    const completedTier2 = quizUnlockTiers.tier2.filter(quiz => completedQuizzes.includes(quiz)).length;
    return {
      ...lockedQuizMessages.tier3,
      currentProgress: `${completedTier2}/${quizUnlockTiers.tier2.length}`
    };
  }
  
  return null;
};

export const isLastQuiz = (quizId: string): boolean => {
  return quizId === 'quiz-6'; // The very last quiz
};