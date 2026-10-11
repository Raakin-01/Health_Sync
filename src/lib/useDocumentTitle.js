import { useEffect } from 'react'

// Sets the browser tab title per page: useDocumentTitle('Queue') ->
// "HealthSync - Queue". Passing nothing restores the plain app title.
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `HealthSync - ${title}` : 'HealthSync'
  }, [title])
}
