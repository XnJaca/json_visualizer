
import { Component, computed, signal } from '@angular/core';
import { JsonEditorComponent } from './components/json-editor/json-editor.component';
import { GraphVisualizerComponent } from './components/graph-visualizer/graph-visualizer.component';
import { JsonTransformService, GraphNode } from './services/json-transform.service';

// Use a Template Literal for safety with newlines and escaped characters
const DEFAULT_JSON_STR = `
{
    "state": true,
    "data": {
        "id": "c61e1694-79e7-43ad-b4e8-ba5d8fd67094",
        "title": "Planeamiento Matematicas",
        "regionalDirection": "Dirección Regional de ALAJUELA",
        "schoolName": "C.T.P. CALLE ZAMORA",
        "teacherName": "Jonathan Cruz",
        "subject": {
            "id": "0298a3f8-359f-4982-8deb-f132a7b29f6a",
            "name": "Matemáticas",
            "description": "Matemáticas para primaria",
            "code": "MAT-PRI-PRIMER"
        },
        "schoolYear": "2025",
        "academicYear": "2025",
        "frequency": "MONTHLY",
        "monthSelected": "NOVIEMBRE",
        "generalCompetence": {
            "id": "1c5a6753-c757-467f-9165-b5a78dcdd66e",
            "title": "Competencias para el empleo digno",
            "description": "Competencias orientadas hacia la inserción laboral digna",
            "monthCompetence": [
                {
                    "id": "187fd423-6389-4f4f-8a84-b1ae007a4513",
                    "name": "Noviembre"
                },
                {
                    "id": "3df757ad-9649-472f-b2a2-d661c8e83241",
                    "name": "Octubre"
                },
                {
                    "id": "449a1e1a-5c46-49b5-8ca5-37a4e793ab2c",
                    "name": "Septiembre"
                }
            ]
        },
        "subarea": null,
        "expectedLearnings": [],
        "mediationStrategies": null,
        "evaluationIndicators": null,
        "reflections": null,
        "whatWorked": null,
        "whatDidNotWork": null,
        "whatCanIImprove": null,
        "observations": null,
        "createdBy": {
            "id": "d7d430be-eb1e-4f3a-9d4d-3f7f9c3ac78c",
            "identification": "12233221",
            "firstName": "Jonathan",
            "lastName": "Cruz",
            "email": "xnjaca@gmail.com",
            "phone": "85082921",
            "isActive": true,
            "profilePicture": null,
            "hasCompletedOnboarding": false,
            "onboardingCompletedAt": null,
            "onboardingVersion": null,
            "skippedSteps": null
        },
        "section": {
            "id": "28cf7ab9-5d1c-43e8-abee-f0a885f09e41",
            "name": "1-1 Matemáticas",
            "identifier": "1-1-MAT-PRI-PRIMER"
        },
        "expectedLearningIA": null,
        "academicTitle": {
            "id": "6674b8f5-c313-46b4-92ee-6211cc8e84ef",
            "json": [
                {
                    "position": 1,
                    "title": "APPROACH_ACADEMIC_TITLE",
                    "key": "title",
                    "type": "ACADEMIC"
                },
                {
                    "position": 2,
                    "title": "APPROACH_ACADEMIC_REGIONAL_DIRECTION",
                    "key": "regionalDirection",
                    "type": "ACADEMIC"
                },
                {
                    "position": 3,
                    "title": "APPROACH_ACADEMIC_SCHOOL_NAME",
                    "key": "schoolName",
                    "type": "ACADEMIC"
                },
                {
                    "position": 4,
                    "title": "APPROACH_ACADEMIC_TEACHER_NAME",
                    "key": "teacherName",
                    "type": "ACADEMIC"
                },
                {
                    "position": 5,
                    "title": "APPROACH_ACADEMIC_SUBJECT_OTHERS",
                    "key": "subject",
                    "type": "ACADEMIC"
                },
                {
                    "position": 6,
                    "title": "APPROACH_ACADEMIC_SCHOOL_YEAR",
                    "key": "schoolYear",
                    "type": "ACADEMIC"
                },
                {
                    "position": 7,
                    "title": "APPROACH_ACADEMIC_ACADEMIC_YEAR",
                    "key": "academicYear",
                    "type": "ACADEMIC"
                },
                {
                    "position": 8,
                    "title": "APPROACH_ACADEMIC_FREQUENCY",
                    "key": "frequency",
                    "type": "ACADEMIC"
                },
                {
                    "position": 9,
                    "title": "APPROACH_ACADEMIC_MONTH_SELECTED",
                    "key": "monthSelected",
                    "type": "ACADEMIC"
                },
                {
                    "position": 10,
                    "title": "APPROACH_ACADEMIC_EXPECTED_LEARNINGS",
                    "key": "expectedLearnings",
                    "type": "ACADEMIC",
                    "metadata": {
                        "title": "Aprendizajes esperados",
                        "content": "Corresponden a los componentes propios del programa de estudio."
                    }
                },
                {
                    "position": 11,
                    "title": "APPROACH_ACADEMIC_MEDIATION_STRATEGIES",
                    "key": "mediationStrategies",
                    "type": "ACADEMIC",
                    "metadata": {
                        "title": "Estrategias de mediación",
                        "content": "Consiste en la descripción detallada de las actividades didácticas."
                    }
                },
                {
                    "position": 12,
                    "title": "APPROACH_ACADEMIC_EVALUATION_INDICATORS",
                    "key": "evaluationIndicators",
                    "type": "ACADEMIC",
                    "metadata": {
                        "title": "Aprendizajes esperados",
                        "content": "Los indicadores son descripciones de conductas observables."
                    }
                },
                {
                    "position": 13,
                    "title": "APPROACH_ACADEMIC_REFLECTIONS",
                    "key": "reflections",
                    "type": "ACADEMIC"
                },
                {
                    "position": 14,
                    "title": "APPROACH_ACADEMIC_WHAT_WORKED",
                    "key": "whatWorked",
                    "type": "ACADEMIC"
                },
                {
                    "position": 15,
                    "title": "APPROACH_ACADEMIC_WHAT_DID_NOT_WORK",
                    "key": "whatDidNotWork",
                    "type": "ACADEMIC"
                },
                {
                    "position": 16,
                    "title": "APPROACH_ACADEMIC_WHAT_CAN_I_IMPROVE",
                    "key": "whatCanIImprove",
                    "type": "ACADEMIC"
                },
                {
                    "position": 17,
                    "title": "APPROACH_ACADEMIC_OBSERVATIONS",
                    "key": "observations",
                    "type": "ACADEMIC"
                }
            ]
        },
        "planningItems": [
            {
                "id": "e57f9bf5-0e8d-4b52-a6f5-b97b96f65f80",
                "expectedLearnings": [
                    {
                        "id": "c298edcb-0d3f-4d66-94d5-f635f4e05596",
                        "title": "Identificar varias utilidades\\nde los números en diferentes contextos cotidianos.",
                        "description": "",
                        "studyProgramId": "eb489de2-86ed-4678-b59b-f350ac4488c4",
                        "unitName": "Números"
                    },
                    {
                        "id": "f7fce5b7-48f2-4c92-9757-1115065b8cb0",
                        "title": "Utilizar el conteo para\\nasociar conjuntos de objetos con su respectiva cardinalidad.",
                        "description": "",
                        "studyProgramId": "eb489de2-86ed-4678-b59b-f350ac4488c4",
                        "unitName": "Números"
                    }
                ],
                "mediationStrategy": null,
                "evaluationIndicator": null,
                "expectedLearningIa": null,
                "mediationStrategiesCustom": "1. **El Mercado de Números: Contando y Asociando**\\nLa persona docente inicia la sesión presentando un problema contextualizado: 'Imaginemos que estamos en un mercado...'.",
                "evaluationIndicatorsCustom": "1. **Aplica el uso de números para resolver problemas cotidianos en un mercado, como contar frutas**\\n\\n---\\n\\n1. **Utiliza el conteo para asociar correctamente conjuntos de frutas con su cardinalidad en un mercado simulado**",
                "indicatorBase": "Identifica, Describe, Aplica Utilidades de los números en contextos cotidianos Usando ejemplos del mercado",
                "order": 1,
                "lessons": [
                    {
                        "id": "b710649b-456f-4485-bb73-a5d4dba1b6a5",
                        "date": "2025-12-08",
                        "startTime": "07:00:00",
                        "endTime": "07:40:00",
                        "topic": null,
                        "description": null,
                        "type": "PRESENTIAL",
                        "status": "PLANNED",
                        "createdAt": "2025-11-28 23:03:31",
                        "updatedAt": "2025-11-28 23:03:31"
                    }
                ]
            }
        ]
    }
}
`;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonEditorComponent, GraphVisualizerComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  jsonString = signal<string>('');
  
  // Computed state derived from jsonString
  parseResult = computed(() => {
    try {
      const str = this.jsonString();
      if (!str.trim()) return { data: null, error: null };
      const parsed = JSON.parse(str);
      return { data: parsed, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  });

  // Computed graph data
  graphData = computed(() => {
    const res = this.parseResult();
    if (res.data) {
      return this.transformService.transform(res.data);
    }
    return null;
  });

  error = computed(() => this.parseResult().error);

  constructor(private transformService: JsonTransformService) {
      this.loadSample();
  }

  updateJson(newJson: string) {
    this.jsonString.set(newJson);
  }

  loadSample() {
    try {
        const parsed = JSON.parse(DEFAULT_JSON_STR);
        this.jsonString.set(JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.error('Failed to parse default JSON', e);
        this.jsonString.set('{}');
    }
  }
}
