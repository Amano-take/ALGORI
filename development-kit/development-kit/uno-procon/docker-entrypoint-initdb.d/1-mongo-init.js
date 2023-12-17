var user = {
  user: 'uno',
  pwd: 'uno',
  roles: [
    {
      role: 'dbOwner',
      db: 'uno-local',
    },
  ],
};

db.createUser(user);
