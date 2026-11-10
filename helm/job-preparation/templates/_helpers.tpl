{{- define "job-preparation.name" -}}
{{- .Chart.Name -}}
{{- end -}}
{{- define "job-preparation.fullname" -}}
{{- .Release.Name -}}
{{- end -}}
