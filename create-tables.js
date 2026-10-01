const { Client } = require("pg");

const sql = `
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null,
  name varchar(120) not null,
  password_hash text,
  google_id varchar(255),
  university varchar(160),
  program varchar(160),
  target_cgpa numeric(4,2),
  scale numeric(4,2) default '5.00',
  seeded boolean default false,
  created_at timestamp not null default now()
);
create unique index if not exists users_email_idx on users(email);
create unique index if not exists users_google_id_idx on users(google_id);

create table if not exists semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(120) not null,
  year integer not null,
  term varchar(30) not null,
  "order" integer not null default 0,
  is_current boolean default false,
  created_at timestamp not null default now()
);
create index if not exists semesters_user_idx on semesters(user_id);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references semesters(id) on delete cascade,
  code varchar(30) not null,
  title varchar(180) not null,
  credits numeric(4,1) not null,
  grade varchar(4),
  score numeric(5,2),
  difficulty varchar(20) default 'medium',
  notes text,
  created_at timestamp not null default now()
);
create index if not exists courses_semester_idx on courses(semester_id);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash varchar(128) not null,
  expires_at timestamp not null,
  used_at timestamp,
  created_at timestamp not null default now()
);
create index if not exists password_reset_tokens_user_idx on password_reset_tokens(user_id);
create unique index if not exists password_reset_tokens_token_idx on password_reset_tokens(token_hash);
`;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

client
  .connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log("All tables created successfully.");
    return client.query(
      "select table_name from information_schema.tables where table_schema='public'"
    );
  })
  .then((r) => {
    console.log("Tables now in database:", r.rows.map((row) => row.table_name));
    client.end();
  })
  .catch((e) => {
    console.error("ERROR:", e);
    client.end();
  });
