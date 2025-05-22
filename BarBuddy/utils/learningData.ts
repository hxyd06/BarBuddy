export const modules = [
  {
    id: 'beginner-1',
    title: 'Basic Bar Tools',
    description: 'Learn about essential bar tools every bartender needs.',
    level: 'beginner',
    content: [
      {
        title: 'Essential Tools',
        text: 'Start with a shaker, jigger, bar spoon, and strainer. These basic tools will let you make most cocktails.',
        tips: 'A good Boston shaker and jigger are your most important investments.'
      }
    ]
  },
  {
    id: 'intermediate-1',
    title: 'Cocktail Balance',
    description: 'Master the art of balancing sweet, sour, and strong flavors.',
    level: 'intermediate',
    content: [
      {
        title: 'The Perfect Balance',
        text: 'A balanced cocktail has the right mix of spirit, sweet, and sour. The classic ratio is 2:1:1.',
        tips: 'Always taste as you go and adjust to your preference.'
      }
    ]
  },
  {
    id: 'advanced-1',
    title: 'Advanced Techniques',
    description: 'Learn professional bartending techniques and flavor combinations.',
    level: 'advanced',
    content: [
      {
        title: 'Pro Techniques',
        text: 'Advanced bartenders use techniques like fat washing, clarification, and molecular mixology.',
        tips: 'Practice these techniques with simple recipes before attempting complex cocktails.'
      }
    ]
  }
];

export const quizzes = [
  {
    id: 'quiz-1',
    title: 'Basic Bartending Quiz',
    description: 'Test your basic bartending knowledge',
    difficulty: 'beginner',
    questions: [
      {
        text: 'What tool is used to measure liquid ingredients?',
        answers: ['Muddler', 'Jigger', 'Strainer', 'Spoon'],
        correctAnswer: 1
      },
      {
        text: 'What is the main ingredient in gin?',
        answers: ['Vodka', 'Rum', 'Juniper', 'Mint'],
        correctAnswer: 2
      },
      {
        text: 'Which glass is used for a Martini?',
        answers: ['Rocks glass', 'Highball', 'Martini glass', 'Shot glass'],
        correctAnswer: 2
      }
    ]
  },
  {
    id: 'quiz-2',
    title: 'Advanced Mixology Quiz',
    description: 'Challenge your advanced bartending skills',
    difficulty: 'advanced',
    questions: [
      {
        text: 'What is the classic sour cocktail ratio?',
        answers: ['1:1:1', '2:1:1', '3:1:1', '1:2:1'],
        correctAnswer: 1
      },
      {
        text: 'What technique uses egg whites?',
        answers: ['Shaking', 'Dry shake', 'Stirring', 'Building'],
        correctAnswer: 1
      },
      {
        text: 'What creates foam in cocktails?',
        answers: ['Ice', 'Citrus', 'Egg white', 'Sugar'],
        correctAnswer: 2
      }
    ]
  }
];