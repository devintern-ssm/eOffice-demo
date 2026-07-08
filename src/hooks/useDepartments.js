import { useEffect, useState } from 'react'
import { listDepartments } from '../api/departments'

/** Load active departments once. Returns [{ id, name, code }] (empty until loaded). */
export function useDepartments() {
  const [departments, setDepartments] = useState([])
  useEffect(() => {
    let active = true
    listDepartments().then((d) => { if (active) setDepartments(d) }).catch(() => {})
    return () => { active = false }
  }, [])
  return departments
}

/** Convenience: just the department names. */
export function useDepartmentNames() {
  return useDepartments().map((d) => d.name)
}
