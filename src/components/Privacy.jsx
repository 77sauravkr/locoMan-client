const SECTIONS = [
  ["What we store", "Your username, a scrambled (hashed) password and recovery code, or your Google account id and email if you sign in with Google. Your chats, trips and shared expenses."],
  ["What is sent to AI", "Your messages, recent chat history, photos and voice recordings are sent to Google Gemini to produce answers. On Gemini's free tier, Google may use this content to improve its products, and people may review it. Do not send anything private or sensitive."],
  ["Photos, voice and location", "Photos and recordings are used for one reply and are not saved by LocoMan. Location is used only when you switch on Near me, is rounded to about 1 km, and is not saved."],
  ["Other services", "Weather comes from Open-Meteo, map search and map pictures from OpenStreetMap. They receive the place name or map area. Booking links open other websites with the destination and dates."],
  ["Group trips", "Everyone who joins a trip can see and edit its plan and expenses, and sees members' usernames. Treat the invite link like a key."],
  ["On your device", "A login cookie keeps you signed in. Trips you open are copied to this browser so they work offline, and are removed when you log out."],
  ["Deleting your data", "Account page, then Delete account. This removes your account, chats and the trips you created. Your name stays in expense records of trips created by others."],
];

export default function Privacy() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-8">
      <h2 className="text-2xl font-bold">Privacy</h2>
      <p className="mt-1 text-sm text-slate-500">Last updated November 2026</p>
      {SECTIONS.map(([title, body]) => (
        <section key={title} className="mt-6">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{body}</p>
        </section>
      ))}
    </article>
  );
}
