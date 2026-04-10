load('ext://restart_process', 'custom_build_with_restart')
allow_k8s_contexts('minikube')
k8s_yaml(kustomize('k8s/overlays/dev'))

COMMON_IGNORE_PATHS = ['node_modules', 'dist', '.gradle']
IS_WIN = os.name == 'nt'
GRADLEW_EXE = 'gradlew.bat' if IS_WIN else './gradlew'
REF_VAR = '%EXPECTED_REF%' if IS_WIN else '$EXPECTED_REF'

def gradle_cmd(context_path, task, extra_args=""):
    return 'cd {} && {} {} {}'.format(context_path, GRADLEW_EXE, task, extra_args).strip()

def verify_repository_exists(service_name):
    context_path = '../' + service_name
    if not os.path.exists(context_path):
        fail('\nMissing Directory: {}\nRun the setup script to clone the microservices before launching Tilt.'.format(context_path))

def build_node_pipeline(service_name):
    verify_repository_exists(service_name)
    context_path = '../' + service_name
    
    docker_build(
        'ghcr.io/energyconsumptionoptimizer/' + service_name,
        context_path,
        dockerfile=context_path + '/Dockerfile',
        target='dev',
        ignore=COMMON_IGNORE_PATHS,
        live_update=[
            sync(context_path + '/src', '/app/src'),
            sync(context_path + '/tsconfig.json', '/app/tsconfig.json'),
            sync(context_path + '/package.json', '/app/package.json'),
            sync(context_path + '/package-lock.json', '/app/package-lock.json'),
            run('npm install', trigger=[
                context_path + '/package.json', 
                context_path + '/package-lock.json'
            ]),
        ],
    )

def build_kotlin_pipeline(service_name, main_class):
    verify_repository_exists(service_name)
    context_path = '../' + service_name

    compile_command = gradle_cmd(context_path, 'classes', '--build-cache --quiet -Dorg.gradle.jvmargs="-Xmx512m"')
    jib_command = gradle_cmd(context_path, 'jibDockerBuild', '--no-configuration-cache --image={} --quiet'.format(REF_VAR))

    local_resource(
        name=service_name + "-compile",
        cmd=compile_command,
        deps=[
            context_path + '/src',
            context_path + '/build.gradle.kts',
            context_path + '/settings.gradle.kts',
        ],
        auto_init=False,
    )

    custom_build_with_restart(
        ref='ghcr.io/energyconsumptionoptimizer/' + service_name,
        command=jib_command,
        deps=[
            context_path + '/build.gradle.kts',
            context_path + '/settings.gradle.kts',
            context_path + '/gradle.properties',
            context_path + '/build/classes/kotlin/main',
            context_path + '/build/resources/main',
        ],
        ignore=COMMON_IGNORE_PATHS,
        entrypoint=['java', '-cp', '/app/resources:/app/classes:/app/libs/*', main_class],
        live_update=[
            sync(context_path + '/build/classes/kotlin/main', '/app/classes'),
            sync(context_path + '/build/resources/main', '/app/resources'),
        ]
    )

def build_frontend_pipeline():
    verify_repository_exists('frontend')
    context_path = '../frontend'
    
    docker_build(
        'ghcr.io/energyconsumptionoptimizer/frontend',
        context_path,
        dockerfile=context_path + '/Dockerfile',
        target='dev',
        ignore=COMMON_IGNORE_PATHS,
        live_update=[
            sync(context_path + '/src', '/app/src'),
            sync(context_path + '/public', '/app/public'),
            sync(context_path + '/index.html', '/app/index.html'),
            sync(context_path + '/vite.config.ts', '/app/vite.config.ts'),
            sync(context_path + '/package.json', '/app/package.json'),
            sync(context_path + '/package-lock.json', '/app/package-lock.json'),
            run('npm install', trigger=[
                context_path + '/package.json', 
                context_path + '/package-lock.json'
            ]),
        ],
    )

build_frontend_pipeline()

for service in ['alert-service', 'monitoring-service', 'smart-furniture-hookup-service', 'threshold-service', 'user-service']:
    build_node_pipeline(service)

build_kotlin_pipeline('forecast-service', 'io.energyconsumptionoptimizer.forecastservice.ServerKt')
build_kotlin_pipeline('map-service', 'io.energyconsumptionoptimizer.mapservice.ServerKt')

for db in ['mongodb', 'influxdb']:
    k8s_resource(db, labels=['database'])

for service in ['forecast', 'map']:
    k8s_resource(service, labels=['backend'])

for service in ['alert', 'hookup', 'threshold', 'user', 'monitoring']:
    k8s_resource(service, labels=['backend'])

k8s_resource('frontend', labels=['frontend'])

local_resource(
    name='ingress-tunnel',
    serve_cmd='kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8080:80',
    labels=['infrastructure']
)