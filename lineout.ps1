=1
Get-Content app/visitor/checkin/page.tsx | ForEach-Object {
  '{0,4}: {1}' -f , 
  ++
}
