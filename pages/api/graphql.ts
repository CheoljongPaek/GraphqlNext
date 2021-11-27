import Cors from 'micro-cors'
import { gql, ApolloServer } from 'apollo-server-micro'
import { Client, Map, Documents, Collection, Lambda, Get, Paginate } from 'faunadb'

const client = new Client({
  secret: process.env.FAUNA_SECRET ?? '',
  domain: 'db.fauna.com'
})

export const config = {
  api: {
    bodyParser: false
  }
}

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin'
  },
  {
    title: 'City of Glass',
    author: 'Paul August'
  }
]

const typeDefs = gql`
  type Book {
    title: String
    author: String
  }
  type Query {
    books: [Book]
  }
`

const resolvers = {
  Query: {
    books: async () => {
      const response = await client.query<any>(
        Map(
          Paginate(Documents(Collection('Book'))),
          Lambda((x) => Get(x))
        )
      )
      const books = response.data.map((item:any) => item.data)
      console.log('----->', books);
      return books
    }
  }
}

const cors = Cors()

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {

  },
  introspection: true,
  
})

const serverStart = apolloServer.start();

export default cors(async(req, res) => {
  if (req.method == 'OPTIONS') {
    res.end();
    return false;
  }

  await serverStart;
  await apolloServer.createHandler({
    path: '/api/graphql'
  })(req, res);
});