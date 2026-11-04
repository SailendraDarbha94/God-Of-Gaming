import type { Game } from '@gog/domain';

export function GameChips({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return <p className="text-muted text-sm">Games are not listed yet.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Games available">
      {games.map((game) => (
        <li key={game.id} className="chip">
          {game.name}
        </li>
      ))}
    </ul>
  );
}
