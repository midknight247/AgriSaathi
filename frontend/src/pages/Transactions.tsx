
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

type Transaction = {
  id: string
  crop_name?: string
  final_price_per_kg: number
  final_quantity_kg: number
  total_amount: number
  transaction_status: string
  payment_status: string
  created_at?: string | null
}

function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      try {
        const token = localStorage.getItem('access_token')

        const data = await apiRequest('/transactions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setTransactions(data.transactions || [])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong'
        )
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [])

  if (loading) {
    return (
      <main className="page-container">
        <p>Loading transactions...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>
          Review your confirmed produce sales, quantities and
          final transaction amounts.
        </p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!error && transactions.length === 0 && (
        <div className="card">
          <p>No transactions found.</p>
        </div>
      )}

      <section className="transactions-grid">
        {transactions.map((transaction) => (
          <article
            key={transaction.id}
            className="transaction-card"
          >
            <div className="transaction-header">
              <div>
                <span className="transaction-label">
                  Transaction
                </span>

                <h2>
                  {transaction.crop_name ||
                    'Produce transaction'}
                </h2>
              </div>

              <span className="status">
                {transaction.transaction_status}
              </span>
            </div>

            <div className="transaction-summary">
              <div className="transaction-total">
                <span>Total amount</span>
                <strong>
                  ₹{transaction.total_amount}
                </strong>
              </div>

              <div>
                <span>Final price</span>
                <strong>
                  ₹{transaction.final_price_per_kg} / kg
                </strong>
              </div>

              <div>
                <span>Quantity</span>
                <strong>
                  {transaction.final_quantity_kg} kg
                </strong>
              </div>

              <div>
                <span>Payment</span>
                <strong>
                  {transaction.payment_status}
                </strong>
              </div>
            </div>

            <div className="transaction-meta">
              <div>
                <span>Transaction ID</span>
                <p>{transaction.id}</p>
              </div>

              {transaction.created_at && (
                <div>
                  <span>Created</span>
                  <p>
                    {new Date(
                      transaction.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Transactions
