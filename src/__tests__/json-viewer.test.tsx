import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JSONViewer } from '@/components/json-viewer'

describe('JSONViewer', () => {
  it('renders root object summary', () => {
    render(<JSONViewer data={{ a: 1, b: 2 }} />)
    expect(screen.getByText('Object')).toBeTruthy()
    expect(screen.getByText('2 keys')).toBeTruthy()
  })

  it('expands and collapses nodes', () => {
    render(<JSONViewer data={{ a: { c: 3 } }} />)
    fireEvent.click(screen.getByText('Expand'))
    expect(screen.getByText('a')).toBeTruthy()
  })

  it('lazy loads array items', () => {
    render(<JSONViewer data={Array.from({ length: 60 }, (_, i) => i)} />)
    fireEvent.click(screen.getByText('Expand'))
    expect(screen.getByText('Show more')).toBeTruthy()
  })
})