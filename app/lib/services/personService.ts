import { prisma } from '../prisma';

export const personService = {
  // Get all people
  getAllPeople: async () => {
    return prisma.person.findMany();
  },

  // Get a person by ID
  getPersonById: async (id: string) => {
    return prisma.person.findUnique({
      where: { id },
      include: {
        expensesPaid: true,
        expenseSplits: true,
        groupMemberships: {
          include: {
            group: true,
          },
        },
      },
    });
  },

  // Create a new person
  createPerson: async (name: string) => {
    return prisma.person.create({
      data: { name },
    });
  },

  // Update a person
  updatePerson: async (id: string, name: string) => {
    return prisma.person.update({
      where: { id },
      data: { name },
    });
  },

  // Delete a person
  deletePerson: async (id: string) => {
    return prisma.person.delete({
      where: { id },
    });
  },
}; 