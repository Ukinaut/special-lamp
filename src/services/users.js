// ----------------------------------------------------
// AITUE COMUNICA S.A. - Equipo de Pruebas & Admin Users DB
// ----------------------------------------------------

const USERS_STORAGE_KEY = 'aitue_admin_users';

const DEFAULT_USERS = [
  {
    id: 'usr_1',
    name: 'Micaela Quinteros',
    phone: '+54 9 11 7358-3768',
    email: 'mquinteros@aitue.net',
    area: 'Área Técnica',
    role: 'Entrenador IA',
    status: 'Activo',
    createdAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'usr_4',
    name: 'Hugo Flores',
    phone: '+54 9 387 501-4000',
    email: 'hflores@aitue.net',
    area: 'Área Técnica',
    role: 'Entrenador IA',
    status: 'Activo',
    createdAt: '2026-08-11T12:00:00.000Z'
  }
];

export class UsersService {
  static getUsers() {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(u => !u.name.includes('Susana') && !u.name.includes('Alejandro'));
        }
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return [...DEFAULT_USERS];
  }

  static saveUsers(users) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return true;
    } catch (e) {
      console.error('Error saving users:', e);
      return false;
    }
  }

  static addUser(user) {
    const users = this.getUsers();
    const newUser = {
      id: `usr_${Date.now()}`,
      name: user.name || user.email.split('@')[0],
      phone: user.phone || 'S/N',
      email: user.email,
      area: user.area || 'Técnica/Comercial',
      role: user.role || 'Entrenador IA',
      status: 'Activo',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  static deleteUser(id) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== id);
    return this.saveUsers(users);
  }
}
