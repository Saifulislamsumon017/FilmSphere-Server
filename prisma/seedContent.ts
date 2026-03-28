// seed.ts
import 'dotenv/config';
import { prisma } from '../src/app/lib/prisma.js';
import { ContentType, PricingType } from '../src/generated/prisma/client.js';

async function seedMovies() {
  const comingSoon = [
    // 🎬 Movies
    {
      title: 'Spider-Man: Beyond the Spider-Verse',
      synopsis:
        'The final chapter in the Spider-Verse trilogy, as Miles Morales must save the multiverse and his friends one last time.',
      thumbnail:
        'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=1000',
      genre: ['Action', 'Animation', 'Sci-Fi'],
      language: ['English'],
      releaseYear: 2027,
      director: 'Joaquim Dos Santos',
      cast: ['Shameik Moore', 'Hailee Steinfeld'],
      streamingPlatform: ['Netflix'],
      type: ContentType.MOVIE,
      runtime: 140,
      pricing: PricingType.FREE,
    },
    {
      title: 'Avatar 4',
      synopsis:
        'The journey of the Sully family continues as they explore the vast oceans and new continents of Pandora.',
      thumbnail:
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000',
      genre: ['Sci-Fi', 'Action', 'Adventure'],
      language: ['English'],
      releaseYear: 2027,
      director: 'James Cameron',
      cast: ['Sam Worthington', 'Zoe Saldana'],
      streamingPlatform: ['Disney+'],
      type: ContentType.MOVIE,
      runtime: 180,
      pricing: PricingType.PREMIUM,
      buyPrice: 1900,
      rentPrice: 600,
    },
    {
      title: 'Avengers: Secret Wars',
      synopsis:
        'The ultimate showdown as superheroes from across the multiverse unite to stop a threat to existence itself.',
      thumbnail:
        'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1000',
      genre: ['Action', 'Sci-Fi', 'Adventure'],
      language: ['English'],
      releaseYear: 2027,
      director: 'Anthony Russo',
      cast: ['Robert Downey Jr.', 'Chris Evans'],
      streamingPlatform: ['Disney+'],
      type: ContentType.MOVIE,
      runtime: 165,
      pricing: PricingType.FREE,
    },
    {
      title: 'Star Wars: New Jedi Order',
      synopsis:
        'A new era begins as the Jedi Order is rebuilt under the guidance of Rey Skywalker.',
      thumbnail:
        'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?q=80&w=1000',
      genre: ['Sci-Fi', 'Action', 'Adventure'],
      language: ['English'],
      releaseYear: 2027,
      director: 'Sharmeen Obaid-Chinoy',
      cast: ['Daisy Ridley'],
      streamingPlatform: ['Disney+'],
      type: ContentType.MOVIE,
      runtime: 150,
      pricing: PricingType.FREE,
    },

    // 📺 Series
    {
      title: 'Stranger Things Season 5',
      synopsis:
        'The epic conclusion as the Hawkins group faces their greatest challenge yet from the Upside Down.',
      thumbnail:
        'https://images.unsplash.com/photo-1543324547-49520478e5da?q=80&w=1000',
      genre: ['Horror', 'Sci-Fi', 'Drama'],
      language: ['English'],
      releaseYear: 2027,
      director: 'The Duffer Brothers',
      cast: ['Millie Bobby Brown', 'Finn Wolfhard'],
      streamingPlatform: ['Netflix'],
      type: ContentType.SERIES,
      seasons: 5,
      episodes: 8,
      pricing: PricingType.FREE,
    },
    {
      title: 'House of the Dragon Season 3',
      synopsis:
        'The Dance of the Dragons intensifies as the Targaryen civil war reaches a bloody turning point.',
      thumbnail:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000',
      genre: ['Fantasy', 'Drama', 'Action'],
      language: ['English'],
      releaseYear: 2027,
      director: 'Ryan Condal',
      cast: ["Emma D'Arcy", 'Matt Smith'],
      streamingPlatform: ['HBO Max'],
      type: ContentType.SERIES,
      seasons: 3,
      episodes: 10,
      pricing: PricingType.FREE,
    },
    {
      title: 'The Last of Us Season 2',
      synopsis:
        'Joel and Ellie must face the consequences of their actions as they traverse a post-apocalyptic world.',
      thumbnail:
        'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1000',
      genre: ['Drama', 'Action', 'Adventure'],
      language: ['English'],
      releaseYear: 2027,
      director: 'Craig Mazin',
      cast: ['Pedro Pascal', 'Bella Ramsey'],
      streamingPlatform: ['HBO Max'],
      type: ContentType.SERIES,
      seasons: 2,
      episodes: 7,
      pricing: PricingType.PREMIUM,
      buyPrice: 1200,
      rentPrice: 400,
    },
    {
      title: 'One Piece Season 2',
      synopsis:
        'The Straw Hat pirates head to Alabasta as they continue their search for the legendary One Piece.',
      thumbnail:
        'https://images.unsplash.com/photo-1621478374422-35206faeddfb?q=80&w=1000',
      genre: ['Adventure', 'Fantasy', 'Action'],
      language: ['English'],
      releaseYear: 2027,
      director: 'Matt Owens',
      cast: ['Iñaki Godoy', 'Mackenyu'],
      streamingPlatform: ['Netflix'],
      type: ContentType.SERIES,
      seasons: 2,
      episodes: 8,
      pricing: PricingType.FREE,
    },
  ];

  // parallel upsert logic
  await Promise.all(
    comingSoon.map(item =>
      prisma.movie.upsert({
        where: { title: item.title },
        update: { ...item },
        create: { ...item },
      }),
    ),
  );

  console.log('✅ Seeded all coming soon movies & series successfully!');
}

seedMovies()
  .catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
