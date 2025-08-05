import LogoutButton from '../../components/LogoutButton';

export default function HomePage() {
  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Bienvenue sur Tribeo</h1>
      <p>Vous êtes connecté avec succès 🎉</p>
      <LogoutButton />
    </div>
  );
}
